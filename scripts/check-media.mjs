// Kontrollerar att alla bilder och videor som inläggen hänvisar till faktiskt
// finns i repot. (En gång tappades filerna vid en uppladdning från mobilen:
// texten sparades men bilderna kom aldrig fram.)
//
// Körs av GitHub Actions efter varje publicering. Saknas något avslutas
// skriptet med fel → körningen blir röd → GitHub mejlar Alexander automatiskt.
// Utskriften listar exakt vilka inlägg och filer som saknas.
//
// Användning: node scripts/check-media.mjs            (skriver ut + felkod)
//             node scripts/check-media.mjs --json     (bara JSON, används av notify.mjs)
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'src/content/inlagg';

/** Läser listorna "bilder:" och "videor:" ur frontmatter (enkel YAML-tolkning). */
function mediaRefs(md) {
  const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const refs = [];
  let inList = false;
  for (const line of fm.split(/\r?\n/)) {
    if (/^(bilder|videor):/.test(line)) { inList = true; continue; }
    if (/^\S/.test(line)) inList = false;
    const m = inList && line.match(/^\s+-\s+['"]?([^'"]+?)['"]?\s*$/);
    if (m) refs.push(m[1]);
  }
  return refs;
}

export function findMissing() {
  const out = [];
  for (const dir of readdirSync(ROOT)) {
    const md = join(ROOT, dir, 'index.md');
    if (!statSync(join(ROOT, dir)).isDirectory() || !existsSync(md)) continue;
    const text = readFileSync(md, 'utf8');
    if (/^utkast:\s*true/m.test(text)) continue; // utkast kontrolleras inte
    const missing = mediaRefs(text).filter((ref) => !existsSync(join(ROOT, dir, ref.replace(/^\.\//, '').split('/').pop())));
    if (missing.length) out.push({ slug: dir, missing });
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('check-media.mjs')) {
  const result = findMissing();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(result));
  } else if (result.length) {
    console.error('⚠️  Följande inlägg saknar bilder/videor (filerna kom inte med vid uppladdningen):');
    for (const r of result) console.error(`  • ${r.slug}: ${r.missing.join(', ')}`);
    console.error('\nÅtgärd: öppna inlägget i redigeraren, ta bort de trasiga bilderna och lägg till dem igen, spara.');
    process.exit(1);
  } else {
    console.log('Alla bilder och videor finns på plats.');
  }
}
