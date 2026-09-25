// Astro-konfiguration.
// SITE_URL och BASE_PATH sätts automatiskt av GitHub Actions (se
// .github/workflows/deploy.yml) så att länkar fungerar oavsett om sidan ligger
// på https://namn.github.io/ eller https://namn.github.io/kimchi-och-kottbullar/.
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4321',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  image: {
    // Tillåt riktigt stora källbilder (om något skulle slinka förbi redigerarens förminskning).
    service: { config: { limitInputPixels: false } },
  },
});
