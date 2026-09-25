// Maskinläsbar lista över publicerade inlägg (/inlagg.json).
// Används av scripts/notify.mjs för att veta vilka inlägg som är nya och
// vad mejlet ska innehålla (rubrik, utdrag, omslagsbild, länk).
import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { getPosts, slugOf, coverOf, excerptOf, formatDate, countLabel } from '../lib/posts';
import { postUrl } from '../lib/url';

export const GET: APIRoute = async ({ site }) => {
  const posts = await getPosts();
  const out = await Promise.all(
    posts
      .filter((p) => !p.data.utkast)
      .map(async (p) => {
        const cover = coverOf(p);
        const img = cover ? await getImage({ src: cover, width: 1200, format: 'jpg', quality: 80 }) : null;
        return {
          slug: slugOf(p),
          title: p.data.title,
          date: p.data.date.toISOString().slice(0, 10),
          dateLabel: formatDate(p.data.date),
          counts: countLabel(p),
          excerpt: excerptOf(p, 280),
          url: new URL(postUrl(slugOf(p)), site).href,
          image: img ? new URL(img.src, site).href : null,
        };
      }),
  );
  return new Response(JSON.stringify(out, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
