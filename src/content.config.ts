// Beskriver hur ett inlägg ser ut. Fälten matchar formuläret i redigeraren
// (public/admin/config.yml) – ändrar du det ena, ändra det andra.
//
// Varje inlägg är en egen mapp: src/content/inlagg/<datum-rubrik>/index.md
// Bilder och videor ligger i samma mapp som index.md.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Redigeraren kan spara tomma fält som "" eller null – gör dem till undefined.
const optionalString = z.preprocess((v) => (v === '' || v === null ? undefined : v), z.string().optional());
const optionalDate = z.preprocess((v) => (v === '' || v === null ? undefined : v), z.coerce.date().optional());
const list = <T extends z.ZodType>(item: T) =>
  z.preprocess((v) => (v == null ? [] : v), z.array(item)).default([]);

const inlagg = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/inlagg' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    // Utkast syns inte på sidan och skickas inte som mejl.
    utkast: z.boolean().default(false),
    // Filnamn relativt inläggets mapp, t.ex. "IMG_1234.webp".
    bilder: list(z.string()),
    videor: list(z.string()),
    platser: list(
      z.object({
        namn: z.string(),
        // GeoJSON-sträng från redigerarens kartfält: {"type":"Point","coordinates":[lng,lat]}
        karta: optionalString,
        datum: optionalString,
      }),
    ),
    kommande: z
      .preprocess(
        (v) => (v == null ? undefined : v),
        z.object({ text: optionalString, till: optionalDate }).optional(),
      ),
  }),
});

export const collections = { inlagg };
