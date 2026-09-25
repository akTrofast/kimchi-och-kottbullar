// Helskärmsvisning av bilder och videor med PhotoSwipe.
// Varje element med [data-gallery] blir ett eget galleri; länkarna inuti
// (a.media) är bilderna. Videor markeras med data-video och visas som
// HTML-bild med en <video>-spelare.
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';

let started = false;

export function initLightboxes() {
  if (started) return; // skriptet kan inkluderas flera gånger på samma sida
  started = true;

  document.querySelectorAll<HTMLElement>('[data-gallery]').forEach((gallery) => {
    const lightbox = new PhotoSwipeLightbox({
      gallery,
      children: 'a.media',
      pswpModule: () => import('photoswipe'),
      bgOpacity: 0.96,
      showHideAnimationType: 'fade',
      imageClickAction: 'zoom',
      tapAction: 'toggle-controls',
      closeTitle: 'Stäng',
      zoomTitle: 'Zooma',
      arrowPrevTitle: 'Föregående',
      arrowNextTitle: 'Nästa',
      errorMsg: 'Bilden kunde inte laddas',
    });

    // Videor: ersätt bilden med en videospelare.
    lightbox.addFilter('itemData', (itemData) => {
      const el = itemData.element as HTMLElement | undefined;
      const video = el?.dataset.video;
      if (video) {
        const poster = el?.dataset.poster ? ` poster="${el.dataset.poster}"` : '';
        return {
          ...itemData,
          src: undefined, // annars tror PhotoSwipe att det är en bild
          type: 'html',
          html: `<div class="pswp-video"><video src="${video}"${poster} controls playsinline preload="metadata"></video></div>`,
        };
      }
      return itemData;
    });

    // Pausa videon när man sveper vidare eller stänger.
    lightbox.on('contentDeactivate', ({ content }) => {
      content.element?.querySelector('video')?.pause();
    });
    lightbox.on('close', () => {
      document.querySelectorAll<HTMLVideoElement>('.pswp video').forEach((v) => v.pause());
    });

    // Bildtext (t.ex. "Från: Regn, ramen och Bukhansan") längst ner.
    lightbox.on('uiRegister', () => {
      lightbox.pswp?.ui?.registerElement({
        name: 'caption',
        order: 9,
        isButton: false,
        appendTo: 'root',
        onInit: (el, pswp) => {
          el.className = 'pswp__caption-bar';
          pswp.on('change', () => {
            const html = (pswp.currSlide?.data.element as HTMLElement | undefined)?.dataset.caption ?? '';
            el.innerHTML = html;
            el.hidden = !html;
          });
        },
      });
    });

    lightbox.init();
  });
}
