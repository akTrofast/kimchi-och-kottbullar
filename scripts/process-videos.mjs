// Krymper videor som laddats upp via redigeraren.
//
// Körs automatiskt av GitHub Actions före varje bygge (och kan köras lokalt
// med `npm run videos`). För varje ny video i src/content/inlagg/<inlägg>/:
//   1. Gör om den till MP4 (H.264, spelas i alla webbläsare), max 720p,
//      ca 3–5 MB för 20 sekunder.
//   2. Sparar en stillbild "<namn>-web.jpg" som visas innan videon startar.
//   3. Byter filnamnet i inläggets index.md till den nya filen.
//   4. Tar bort originalet (så att sidan inte växer i onödan).
// Färdiga filer känns igen på ändelsen "-web.mp4" och rörs inte igen.
import { readdirSync, readFileSync, writeFileSync, rmSync, statSync, existsSync } from 'node:fs';
import { join, parse } from 'node:path';
import { execFileSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';

const ROOT = 'src/content/inlagg';
const VIDEO = /\.(mov|mp4|m4v|webm|3gp|avi|mkv|hevc)$/i;
const DONE = /-web\.mp4$/i;

let changed = 0;
for (const dir of readdirSync(ROOT)) {
  const folder = join(ROOT, dir);
  if (!statSync(folder).isDirectory()) continue;
  const mdPath = join(folder, 'index.md');
  if (!existsSync(mdPath)) continue;

  for (const file of readdirSync(folder)) {
    if (!VIDEO.test(file) || DONE.test(file)) continue;
    const input = join(folder, file);
    const name = parse(file).name.replace(/[^\w-]+/g, '-');
    const outName = `${name}-web.mp4`;
    const output = join(folder, outName);
    const poster = join(folder, `${name}-web.jpg`);
    console.log(`Krymper ${input} (${(statSync(input).size / 1e6).toFixed(1)} MB) …`);

    // Kortsidan max 720 px (fungerar för både stående och liggande video).
    const scale = "scale='if(gt(iw,ih),-2,min(720,iw))':'if(gt(iw,ih),min(720,ih),-2)'";
    execFileSync(ffmpeg, [
      '-y', '-loglevel', 'error', '-i', input,
      '-vf', `${scale},fps=30`,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '96k', '-ac', '2',
      '-movflags', '+faststart', '-t', '120',
      output,
    ]);
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-ss', '0.3', '-i', output, '-frames:v', '1', '-q:v', '3', poster]);

    // Byt filnamnet i inlägget (frontmatter kan ha "IMG_1.MOV" eller "./IMG_1.MOV").
    const md = readFileSync(mdPath, 'utf8');
    writeFileSync(mdPath, md.split(file).join(outName));
    rmSync(input);
    console.log(`  → ${output} (${(statSync(output).size / 1e6).toFixed(1)} MB)`);
    changed++;
  }
}
console.log(changed ? `${changed} video(r) krympta.` : 'Inga nya videor att krympa.');
