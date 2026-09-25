// Slår ihop platser från alla inlägg till unika platser (en nål per plats).
// Två platser räknas som samma om de har samma namn (oavsett stora/små
// bokstäver och mellanslag) ELLER ligger inom MERGE_METERS från varandra.
import { type Post, placesOf, slugOf } from './posts';

const MERGE_METERS = 500;

export type PlaceVisit = { post: Post; datum?: string };
export type PlaceGroup = {
  id: string; // används i adressen, t.ex. /karta/#plats-busan
  namn: string;
  lat: number;
  lng: number;
  visits: PlaceVisit[]; // nyaste inlägget först
  firstVisit: number; // tidsstämpel för första inlägget (för resrutten)
};

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
export const placeId = (namn: string) => 'plats-' + norm(namn).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function meters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * posts: nyast först (som getPosts()).
 * Returnerar unika platser (i den ordning de först besöktes) och resrutten
 * (index i groups, alla besök i tidsordning).
 */
export function groupPlaces(posts: Post[]): { groups: PlaceGroup[]; route: number[] } {
  const groups: PlaceGroup[] = [];
  const route: number[] = [];
  // Gå igenom äldst först så att platsens namn/position tas från första besöket.
  for (const post of [...posts].reverse()) {
    for (const p of placesOf(post)) {
      if (p.lat == null || p.lng == null) continue;
      const pos = { lat: p.lat, lng: p.lng };
      let g = groups.find((g) => norm(g.namn) === norm(p.namn) || meters(g, pos) < MERGE_METERS);
      if (!g) {
        g = { id: placeId(p.namn), namn: p.namn, ...pos, visits: [], firstVisit: post.data.date.valueOf() };
        groups.push(g);
      }
      const gi = groups.indexOf(g);
      if (route.at(-1) !== gi) route.push(gi);
      // Samma inlägg ska bara listas en gång per plats.
      if (!g.visits.some((v) => slugOf(v.post) === slugOf(post))) g.visits.unshift({ post, datum: p.datum });
    }
  }
  return { groups, route };
}

/** Id för den (sammanslagna) plats som ett visst inläggs plats hamnade i. */
export function placeIdFor(posts: Post[], post: Post, place: { namn: string; lat?: number; lng?: number }): string {
  const mine = groupPlaces(posts).groups.filter((g) => g.visits.some((v) => slugOf(v.post) === slugOf(post)));
  const g =
    mine.find((g) => norm(g.namn) === norm(place.namn)) ??
    (place.lat != null && place.lng != null ? mine.find((g) => meters(g, { lat: place.lat!, lng: place.lng! }) < MERGE_METERS) : undefined);
  return g?.id ?? placeId(place.namn);
}
