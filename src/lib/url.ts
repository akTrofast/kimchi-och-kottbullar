// Bygger interna länkar som fungerar även när sidan ligger i en undermapp
// på GitHub Pages (t.ex. /kimchi-och-kottbullar/).
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export function url(path = '/'): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export const postUrl = (slug: string) => url(`/inlagg/${slug}/`);
