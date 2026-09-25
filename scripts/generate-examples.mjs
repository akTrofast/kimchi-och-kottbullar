// Engångsskript: skapar ikoner och exempelbilder/-video till de tre
// exempelinläggen (tecknade "platshållarbilder", inga riktiga foton).
// Körs med `npm run examples`. Behövs inte för att sidan ska fungera – när
// riktiga inlägg finns kan exempelinläggen tas bort i redigeraren.
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';

// Enkel seedad slump så att bilderna blir likadana varje gång.
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function ridge(w, h, base, amp, freq, phase) {
  let d = `M0 ${h}`;
  for (let i = 0; i <= 60; i++) {
    const x = (w * i) / 60;
    const y = base - amp * (0.6 * Math.sin(x * freq + phase) + 0.3 * Math.sin(x * freq * 2.3 + phase * 1.7) + 0.1 * Math.sin(x * freq * 6.1));
    d += ` L${x.toFixed(0)} ${y.toFixed(0)}`;
  }
  return `${d} L${w} ${h} Z`;
}

const scenes = {
  // Berg i dimma
  mountain: (w, h, [sky1, sky2, ...layers]) => `
    <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky1}"/><stop offset="1" stop-color="${sky2}"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#s)"/>
    <circle cx="${w * (0.2 + rnd() * 0.6)}" cy="${h * 0.3}" r="${w * 0.06}" fill="#fff" opacity=".55"/>
    ${layers.map((c, i) => `<path d="${ridge(w, h, h * (0.45 + i * 0.13), h * (0.14 - i * 0.02), 0.004 + rnd() * 0.004, rnd() * 9)}" fill="${c}"/>`).join('')}`,
  // Stadssiluett
  city: (w, h, [sky1, sky2, b1, b2, win]) => {
    let s = `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky1}"/><stop offset="1" stop-color="${sky2}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#s)"/>`;
    s += `<circle cx="${w * 0.72}" cy="${h * 0.28}" r="${w * 0.05}" fill="${win}" opacity=".8"/>`;
    // N Seoul Tower-liknande torn
    s += `<rect x="${w * 0.3}" y="${h * 0.22}" width="${w * 0.012}" height="${h * 0.4}" fill="${b1}"/><rect x="${w * 0.285}" y="${h * 0.3}" width="${w * 0.042}" height="${h * 0.03}" fill="${b1}"/>`;
    s += `<path d="${ridge(w, h, h * 0.62, h * 0.06, 0.003, 1)}" fill="${b1}"/>`;
    for (const [layer, col] of [[0, b1], [1, b2]]) {
      let x = 0;
      while (x < w) {
        const bw = w * (0.04 + rnd() * 0.07), bh = h * (0.12 + rnd() * (layer ? 0.22 : 0.3));
        const y = h - bh - (layer ? 0 : h * 0.08);
        s += `<rect x="${x}" y="${y}" width="${bw}" height="${h}" fill="${col}"/>`;
        for (let wy = y + 14; wy < h - 20; wy += 26) for (let wx = x + 10; wx < x + bw - 12; wx += 22) if (rnd() > 0.55) s += `<rect x="${wx}" y="${wy}" width="8" height="12" fill="${win}" opacity="${layer ? 0.9 : 0.5}"/>`;
        x += bw + w * 0.004;
      }
    }
    return s;
  },
  // Hav och strand
  sea: (w, h, [sky1, sky2, sea1, sea2, sand]) => `
    <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky1}"/><stop offset="1" stop-color="${sky2}"/></linearGradient>
    <linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sea1}"/><stop offset="1" stop-color="${sea2}"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#s)"/>
    <circle cx="${w * 0.5}" cy="${h * 0.5}" r="${w * 0.09}" fill="#fff4dc" opacity=".9"/>
    <rect y="${h * 0.52}" width="${w}" height="${h}" fill="url(#w)"/>
    ${Array.from({ length: 14 }, (_, i) => `<rect x="${w * rnd()}" y="${h * (0.55 + i * 0.025)}" width="${w * (0.05 + rnd() * 0.2)}" height="3" fill="#fff" opacity=".35"/>`).join('')}
    <path d="${ridge(w, h, h * 0.86, h * 0.03, 0.002, 2)}" fill="${sand}"/>`,
  // Skål ramen/bibimbap ovanifrån
  food: (w, h, [table, bowl, broth, a, b, c]) => {
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.36;
    let s = `<rect width="${w}" height="${h}" fill="${table}"/>`;
    for (let i = 0; i < 9; i++) s += `<rect x="0" y="${(h / 9) * i}" width="${w}" height="2" fill="#000" opacity=".06"/>`;
    s += `<circle cx="${cx + 18}" cy="${cy + 22}" r="${r * 1.08}" fill="#000" opacity=".18"/><circle cx="${cx}" cy="${cy}" r="${r * 1.08}" fill="${bowl}"/><circle cx="${cx}" cy="${cy}" r="${r * 0.92}" fill="${broth}"/>`;
    const parts = [a, b, c, a, b];
    parts.forEach((col, i) => {
      const ang = (i / parts.length) * Math.PI * 2;
      s += `<ellipse cx="${cx + Math.cos(ang) * r * 0.48}" cy="${cy + Math.sin(ang) * r * 0.48}" rx="${r * 0.3}" ry="${r * 0.22}" transform="rotate(${(ang * 180) / Math.PI} ${cx + Math.cos(ang) * r * 0.48} ${cy + Math.sin(ang) * r * 0.48})" fill="${col}"/>`;
    });
    s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.2}" fill="#f7c948"/><circle cx="${cx}" cy="${cy}" r="${r * 0.09}" fill="#e8a317"/>`;
    s += `<rect x="${cx + r * 1.2}" y="${cy - r * 1.1}" width="14" height="${r * 2.3}" rx="7" fill="#c9a36b" transform="rotate(8 ${cx} ${cy})"/><rect x="${cx + r * 1.2 + 26}" y="${cy - r * 1.1}" width="14" height="${r * 2.3}" rx="7" fill="#c9a36b" transform="rotate(8 ${cx} ${cy})"/>`;
    return s;
  },
  // Tempel/palatstak (hanok)
  temple: (w, h, [sky1, sky2, roof, wall, pillar, tree]) => `
    <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky1}"/><stop offset="1" stop-color="${sky2}"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#s)"/>
    <path d="${ridge(w, h, h * 0.55, h * 0.1, 0.003, 4)}" fill="${tree}" opacity=".7"/>
    <rect x="${w * 0.18}" y="${h * 0.5}" width="${w * 0.64}" height="${h * 0.3}" fill="${wall}"/>
    ${[0.22, 0.38, 0.54, 0.7].map((x) => `<rect x="${w * x}" y="${h * 0.5}" width="${w * 0.035}" height="${h * 0.3}" fill="${pillar}"/>`).join('')}
    <path d="M${w * 0.06} ${h * 0.47} Q${w * 0.5} ${h * 0.38} ${w * 0.94} ${h * 0.47} L${w * 0.82} ${h * 0.52} L${w * 0.18} ${h * 0.52} Z" fill="${roof}"/>
    <path d="M${w * 0.2} ${h * 0.4} Q${w * 0.5} ${h * 0.3} ${w * 0.8} ${h * 0.4} L${w * 0.72} ${h * 0.44} L${w * 0.28} ${h * 0.44} Z" fill="${roof}"/>
    <rect y="${h * 0.8}" width="${w}" height="${h * 0.2}" fill="#c8bca8"/>`,
};

const palettes = {
  dusk: ['#f6c8a4', '#e98c7a', '#8b6f8f', '#5b4a6e', '#3a2f4d'],
  misty: ['#dfe7ea', '#b9ccd3', '#7f9ea8', '#557a86', '#2f4f5a'],
  forest: ['#e8efe0', '#c3d6b6', '#7e9d74', '#52714c', '#2e4a2e'],
  night: ['#1b2440', '#3d4a78', '#141a2e', '#232c4a', '#ffd479'],
  day: ['#9fc9e8', '#e7f1f7', '#5c6b7a', '#7d8b99', '#ffe8a8'],
  beach: ['#a6d4ec', '#fbe6c8', '#3f8fb0', '#1f5f7e', '#e9d3a5'],
  sunset: ['#ffcf8a', '#f28a6b', '#2f6c8f', '#1c3f5e', '#d8b98c'],
  ramen: ['#6b4a34', '#f3efe8', '#d9a066', '#4f7a3a', '#c2361f', '#f2e2c4'],
  bibim: ['#3b3b3b', '#1f1f1f', '#8b3a2a', '#e07b39', '#5e9c4a', '#f2e2c4'],
  palace: ['#bfe0f2', '#eaf5fb', '#3e4a45', '#c94f3d', '#2e6b5a', '#5e8a5a'],
};

const W = 2048, H = 1536;
function svg(scene, pal, portrait) {
  const [w, h] = portrait ? [H, W] : [W, H];
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${scenes[scene](w, h, palettes[pal])}
    <text x="${w - 36}" y="${h - 36}" text-anchor="end" font-family="Arial" font-size="30" fill="#fff" opacity=".55" letter-spacing="4">EXEMPELBILD</text></svg>`);
}

async function img(dir, name, scene, pal, portrait = false) {
  mkdirSync(dir, { recursive: true });
  await sharp(svg(scene, pal, portrait)).webp({ quality: 85 }).toFile(`${dir}/${name}.webp`);
  return `${name}.webp`;
}

// ---------- Ikoner ----------
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#c2361f"/><text x="32" y="44" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="#fff">K&amp;K</text></svg>`;
writeFileSync('public/favicon.svg', icon);
await sharp(Buffer.from(icon)).resize(192, 192).png().toFile('public/icon-192.png');
await sharp(Buffer.from(icon)).resize(512, 512).png().toFile('public/icon-512.png');

// ---------- Exempelinlägg ----------
// Skapar bara media för exempelinläggen om man uttryckligen ber om det
// (`npm run examples -- --med-exempel`). Standard: bara ikonerna ovan.
if (!process.argv.includes('--med-exempel')) {
  console.log('Ikoner skapade. (Lägg till --med-exempel för att även skapa exempelbilder.)');
  process.exit(0);
}
const R = 'src/content/inlagg';
const posts = [
  {
    slug: '2026-08-30-framme-forsta-veckan-i-seoul',
    images: [['city', 'day'], ['city', 'night', true], ['food', 'ramen'], ['temple', 'palace'], ['city', 'dusk'], ['food', 'bibim', true], ['mountain', 'misty']],
  },
  {
    slug: '2026-09-13-regn-ramen-och-bukhansan',
    images: [['mountain', 'misty'], ['mountain', 'forest', true], ['mountain', 'dusk'], ['food', 'ramen', true], ['mountain', 'forest'], ['temple', 'palace'], ['mountain', 'misty', true], ['food', 'bibim'], ['city', 'night']],
    video: ['mountain', 'forest'],
  },
  {
    slug: '2026-09-20-helg-i-busan',
    images: [['sea', 'beach'], ['sea', 'sunset', true], ['city', 'dusk'], ['food', 'bibim'], ['sea', 'beach', true], ['temple', 'palace'], ['sea', 'sunset'], ['city', 'night', true], ['food', 'ramen'], ['sea', 'beach'], ['city', 'day']],
  },
];

for (const p of posts) {
  const dir = `${R}/${p.slug}`;
  for (const [i, [scene, pal, portrait]] of p.images.entries()) await img(dir, `bild-${String(i + 1).padStart(2, '0')}`, scene, pal, portrait);
  if (p.video) {
    // 6 sekunders "video": långsam zoom över en stående bild. Sparas som
    // råfil och krymps sedan av scripts/process-videos.mjs, precis som en
    // riktig mobilvideo.
    const still = `${dir}/_video-still.png`;
    await sharp(svg(p.video[0], p.video[1], true)).resize(1080, 1440).png().toFile(still);
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-loop', '1', '-i', still, '-vf', "zoompan=z='min(zoom+0.0015,1.3)':d=180:s=1080x1440:fps=30", '-t', '6', '-pix_fmt', 'yuv420p', `${dir}/exempelvideo.mp4`]);
    const { rmSync } = await import('node:fs');
    rmSync(still);
  }
  console.log(`Skapade media för ${p.slug}`);
}
