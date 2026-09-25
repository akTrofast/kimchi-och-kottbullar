// Skickar mejl till prenumeranterna när ett nytt inlägg har publicerats.
//
// Körs av GitHub Actions EFTER att sidan har publicerats (så att länken i
// mejlet fungerar). Flöde:
//   1. Hämtar <SITE_URL>/inlagg.json från den publicerade sidan.
//   2. Jämför med src/data/notifierade.json (inlägg som redan mejlats ut).
//   3. För varje nytt inlägg (högst 30 dagar gammalt): skapar och skickar en
//      kampanj via Brevos API till prenumerantlistan.
//   4. Lägger till inlägget i notifierade.json (workflowen committar filen).
//
// Miljövariabler (sätts som "secrets"/"variables" i GitHub):
//   BREVO_API_KEY   – API-nyckel från Brevo (hemlig)
//   BREVO_LIST_ID   – id-nummer på listan med prenumeranter
//   SENDER_EMAIL    – avsändaradress som verifierats i Brevo
//   SENDER_NAME     – t.ex. "Alexander – Kimchi & Köttbullar"
//   SITE_URL        – sidans adress (sätts automatiskt av workflowen)
// Saknas BREVO_API_KEY hoppar skriptet tyst över allt (mejl är valfritt).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { findMissing } from './check-media.mjs';

const STATE = 'src/data/notifierade.json';
const { BREVO_API_KEY, BREVO_LIST_ID, SENDER_EMAIL, SENDER_NAME = 'Kimchi & Köttbullar', SITE_URL, DRY_RUN } = process.env;
const MAX_AGE_DAYS = 30;

// DRY_RUN=1: skicka inget, spara mejlen som HTML-filer för förhandsgranskning.
if (!DRY_RUN && (!BREVO_API_KEY || !BREVO_LIST_ID || !SENDER_EMAIL)) {
  console.log('Brevo är inte konfigurerat (BREVO_API_KEY/BREVO_LIST_ID/SENDER_EMAIL saknas) – inga mejl skickas.');
  process.exit(0);
}

const site = SITE_URL.replace(/\/$/, '');
const res = await fetch(`${site}/inlagg.json`, { cache: 'no-store' });
if (!res.ok) throw new Error(`Kunde inte hämta ${site}/inlagg.json (${res.status})`);
const posts = await res.json();

const notified = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : [];
const cutoff = Date.now() - MAX_AGE_DAYS * 86400000;
// Inlägg där bilder/videor saknas mejlas inte ut förrän de är lagade.
const broken = new Set(findMissing().map((r) => r.slug));
for (const slug of broken) console.log(`Hoppar över ${slug} tills alla bilder finns på plats.`);
const fresh = posts
  .filter((p) => !notified.includes(p.slug) && !broken.has(p.slug) && new Date(p.date).valueOf() >= cutoff)
  .reverse(); // äldst först om flera publicerats samtidigt

if (!fresh.length) {
  console.log('Inga nya inlägg att mejla om.');
  process.exit(0);
}

const esc = (s = '') => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function emailHtml(p) {
  return `<!doctype html><html lang="sv"><body style="margin:0;background:#f4f2ef;font-family:Helvetica,Arial,sans-serif;color:#141414">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ef"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff">
<tr><td style="padding:18px 24px;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:bold">Kimchi <span style="color:#c2361f">&amp;</span> Köttbullar</td></tr>
${p.image ? `<tr><td><a href="${p.url}"><img src="${p.image}" width="600" alt="" style="display:block;width:100%;height:auto;border:0"></a></td></tr>` : ''}
<tr><td style="padding:24px">
<div style="font-size:12px;color:#6b6b6b;letter-spacing:1px;text-transform:uppercase">Nytt inlägg · ${esc(p.dateLabel)}${p.counts ? ` · ${esc(p.counts)}` : ''}</div>
<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:34px;line-height:1.1;margin:8px 0 12px">${esc(p.title)}</h1>
<p style="font-size:16px;line-height:1.6;margin:0 0 22px;color:#333">${esc(p.excerpt)}</p>
<a href="${p.url}" style="display:inline-block;background:#141414;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 22px">Läs inlägget →</a>
</td></tr>
<tr><td style="padding:18px 24px;border-top:1px solid #e4e1dc;font-size:12px;color:#6b6b6b">Du får det här mejlet för att du prenumererar på Kimchi &amp; Köttbullar. <a href="{{ unsubscribe }}" style="color:#6b6b6b">Avsluta prenumerationen</a></td></tr>
</table></td></tr></table></body></html>`;
}

async function brevo(path, body) {
  const r = await fetch(`https://api.brevo.com/v3${path}`, {
    method: 'POST',
    headers: { 'api-key': BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Brevo ${path} svarade ${r.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

for (const p of fresh) {
  console.log(`Mejlar om: ${p.title}`);
  if (DRY_RUN) {
    writeFileSync(`mejl-${p.slug}.html`, emailHtml(p));
    console.log(`  (DRY_RUN) sparade mejl-${p.slug}.html`);
    continue;
  }
  let campaign;
  try {
    campaign = await brevo('/emailCampaigns', {
      name: `Nytt inlägg: ${p.title} (${p.date})`,
      subject: `Nytt inlägg: ${p.title}`,
      previewText: p.excerpt.slice(0, 120),
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      htmlContent: emailHtml(p),
      recipients: { listIds: [Number(BREVO_LIST_ID)] },
      inlineImageActivation: false,
    });
  } catch (err) {
    // Ingen har prenumererat (bekräftat) än → inget fel. Inlägget markeras
    // INTE som mejlat, så det skickas vid nästa publicering om någon hunnit
    // prenumerera (så länge inlägget är högst 30 dagar gammalt).
    if (/no contacts associated/i.test(String(err.message))) {
      console.log(`  Listan ${BREVO_LIST_ID} har inga bekräftade prenumeranter än – inget mejl skickat.`);
      continue;
    }
    throw err;
  }
  await brevo(`/emailCampaigns/${campaign.id}/sendNow`);
  notified.push(p.slug);
  writeFileSync(STATE, JSON.stringify(notified, null, 2) + '\n');
  console.log(`  ✓ skickat (kampanj ${campaign.id})`);
}
