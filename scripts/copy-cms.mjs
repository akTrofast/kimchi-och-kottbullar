// Kopierar redigeraren (Sveltia CMS) från node_modules till public/admin/.
// Vi hostar den själva i stället för att ladda den från ett CDN, så att en
// ny version (eller ett CDN som krånglar) aldrig kan förstöra redigeraren.
// Versionen är låst i package.json. Körs automatiskt av `npm run dev/build`.
import { cpSync, mkdirSync } from 'node:fs';

const from = 'node_modules/@sveltia/cms/dist';
const to = 'public/admin/cms';

mkdirSync(to, { recursive: true });
cpSync(`${from}/sveltia-cms.js`, `${to}/sveltia-cms.js`);
cpSync(`${from}/chunks`, `${to}/chunks`, { recursive: true, filter: (p) => !p.endsWith('.map') });
console.log('Sveltia CMS kopierad till public/admin/cms/');
