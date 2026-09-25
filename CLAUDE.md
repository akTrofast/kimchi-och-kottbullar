# Kimchi & Köttbullar – anteckningar för utvecklare / Claude Code

Alexanders utbytesblogg från Seoul (hösten 2026). Svenska, publik, ingen inloggning för besökare.
Ägaren är inte programmerare: allt han gör ska ske i mobilen via redigeraren på `/admin/`.

## Arkitektur (i korthet)
- **Astro 7** statisk sida → **GitHub Pages** via `.github/workflows/deploy.yml`.
- **Sveltia CMS** (låst version, self-hostad: `scripts/copy-cms.mjs` kopierar från node_modules till
  `public/admin/cms/` vid varje dev/build). Konfig: `public/admin/config.yml`. Inloggning med GitHub
  personal access token ("Sign In Using Access Token").
- Inlägg: `src/content/inlagg/<yyyy-mm-dd-rubrik>/index.md` med bilder/videor i samma mapp.
  Schema: `src/content.config.ts` – **måste hållas i synk med `config.yml`**.
- Bilder: redigeraren förminskar till max 2048 px WebP i telefonen. Astro gör sedan responsiva storlekar.
  Filnamn i frontmatter löses upp i `src/lib/posts.ts` via `import.meta.glob` (inte `image()`),
  så både `bild.webp` och `./bild.webp` fungerar.
- Videor: `scripts/process-videos.mjs` (ffmpeg-static) körs i CI före bygget: → `<namn>-web.mp4`
  (H.264, kortsida ≤720 px) + `<namn>-web.jpg` (stillbild), uppdaterar index.md, tar bort originalet
  och committar.
- Mejl: anmälningsformulär postar direkt till Brevo (`src/data/teknik.json` → `brevoFormUrl`).
  Efter deploy kör `scripts/notify.mjs`: läser `<site>/inlagg.json`, jämför med
  `src/data/notifierade.json`, skapar och skickar en Brevo-kampanj per nytt inlägg (≤30 dagar gammalt).
  Secrets/vars i GitHub: `BREVO_API_KEY` (secret), `BREVO_LIST_ID`, `SENDER_EMAIL`, `SENDER_NAME` (vars).
  Saknas de hoppas mejl tyst över. `DRY_RUN=1` sparar mejlen som HTML i stället.
- Karta: Leaflet + OpenStreetMap-tiles (ingen nyckel). Platser anges per inlägg (`platser`, GeoJSON-punkt).
  `src/lib/places.ts` slår ihop platser med samma namn eller inom 500 m till en nål; popupen listar
  förhandsvisningar av alla inlägg kopplade till platsen. `/karta/#plats-<namn>` öppnar en viss plats.
- "Kommande veckan" + dagräknare: `src/components/StatusBar.astro`, räknas om i webbläsaren.
- Inställningar som ägaren kan ändra: `src/data/installningar.json` (redigeras i CMS:et).

## Kommandon
- `npm run dev` – lokal utveckling (bildoptimering i dev är långsam; för skärmdumpar använd
  `npm run build` + `npm run preview`).
- `npm run videos` – krymp videor lokalt.
- `npm run examples` – återskapa exempelbilder/ikoner (bara för exempelinläggen).

## Kända avvägningar
- Sidan får vara max 1 GB på GitHub Pages; videor krymps därför hårt.
- Hela repot är publikt (krav för gratis GitHub Pages) – ägaren har accepterat det.
- Brevo gratis: 300 mejl/dag, "Sent with Brevo"-märkning.
- npm 11 kräver godkända install-skript: se `allowScripts` i package.json (esbuild, ffmpeg-static).
