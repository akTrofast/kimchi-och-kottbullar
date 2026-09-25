// Hjälpfunktioner för inlägg: hämta, sortera, koppla ihop filnamn i
// frontmatter med de faktiska bild-/videofilerna, formatera datum m.m.
import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';

export type Post = CollectionEntry<'inlagg'>;

// Alla bilder och videor som ligger i inläggsmapparna. Vite/Astro tar hand om
// dem vid bygget (bilder optimeras, videor kopieras med unika filnamn).
const imageFiles = import.meta.glob<{ default: ImageMetadata }>(
  '/src/content/inlagg/*/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true },
);
const videoFiles = import.meta.glob<string>('/src/content/inlagg/*/*.{mp4,MP4,webm,WEBM}', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** Mappnamnet = adressen till inlägget, t.ex. "2026-09-13-regn-ramen-och-bukhansan". */
export function slugOf(post: Post): string {
  const p = (post.filePath ?? post.id).replace(/\\/g, '/');
  const parts = p.split('/');
  return parts.at(-1) === 'index.md' ? parts.at(-2)! : post.id;
}

const baseName = (ref: string) => ref.replace(/\\/g, '/').split('/').pop() ?? ref;
const key = (post: Post, ref: string) => `/src/content/inlagg/${slugOf(post)}/${baseName(ref)}`;

export type MediaItem =
  | { kind: 'image'; image: ImageMetadata }
  | { kind: 'video'; src: string; poster?: ImageMetadata };

export function imagesOf(post: Post): ImageMetadata[] {
  return post.data.bilder.map((ref) => imageFiles[key(post, ref)]?.default).filter(Boolean) as ImageMetadata[];
}

export function videosOf(post: Post): { src: string; poster?: ImageMetadata }[] {
  return post.data.videor
    .map((ref) => {
      const src = videoFiles[key(post, ref)];
      if (!src) return null; // t.ex. en .mov som ännu inte krympts (sker automatiskt vid publicering)
      // Videoskriptet skapar en stillbild "<namn>.jpg" bredvid "<namn>.mp4".
      const posterKey = key(post, ref).replace(/\.(mp4|webm)$/i, '.jpg');
      return { src, poster: imageFiles[posterKey]?.default };
    })
    .filter(Boolean) as { src: string; poster?: ImageMetadata }[];
}

/** Bilder och videor i en lista – videorna sprids ut jämnt mellan bilderna. */
export function mediaOf(post: Post): MediaItem[] {
  const images: MediaItem[] = imagesOf(post).map((image) => ({ kind: 'image', image }));
  const videos: MediaItem[] = videosOf(post).map((v) => ({ kind: 'video', ...v }));
  if (!videos.length) return images;
  const out = [...images];
  videos.forEach((v, i) => {
    const pos = Math.round(((i + 1) * images.length) / (videos.length + 1)) + i;
    out.splice(pos, 0, v);
  });
  return out;
}

/** Omslagsbilden = första bilden, annars första videons stillbild. */
export function coverOf(post: Post): ImageMetadata | undefined {
  return imagesOf(post)[0] ?? videosOf(post)[0]?.poster;
}

/** Alla publicerade inlägg, nyast först. Utkast visas bara lokalt (npm run dev). */
export async function getPosts(): Promise<Post[]> {
  const all = await getCollection('inlagg', (p) => import.meta.env.DEV || !p.data.utkast);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

const dateFmt = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' });
const shortFmt = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' });
export const formatDate = (d: Date) => dateFmt.format(d);
export const formatShort = (d: Date) => shortFmt.format(d).replace('.', '');

/** "12 bilder · 1 video" */
export function countLabel(post: Post): string {
  const i = imagesOf(post).length;
  const v = videosOf(post).length;
  const parts = [];
  if (i) parts.push(`${i} ${i === 1 ? 'bild' : 'bilder'}`);
  if (v) parts.push(`${v} ${v === 1 ? 'video' : 'videor'}`);
  return parts.join(' · ');
}

/** Kort utdrag av texten (utan markdown-tecken) för kort och mejl. */
export function excerptOf(post: Post, max = 160): string {
  const text = (post.body ?? '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s*[-+]\s+/gm, '')
    .replace(/[#>*_`~]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? text.slice(0, max).replace(/\s+\S*$/, '').replace(/[.,;:!?]+$/, '') + '…' : text;
}

/** Platser med koordinater, för kartan. */
export function placesOf(post: Post) {
  return post.data.platser.map((p) => {
    let lat: number | undefined, lng: number | undefined;
    try {
      const g = p.karta ? JSON.parse(p.karta) : null;
      if (g?.type === 'Point') [lng, lat] = g.coordinates;
    } catch {
      /* ogiltig/tom karta – platsen visas då bara som text */
    }
    return { namn: p.namn, datum: p.datum, lat, lng };
  });
}
