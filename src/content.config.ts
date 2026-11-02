import { defineCollection } from "astro:content"
import { glob } from "astro/loaders"
import { z } from "astro/zod"

const link = z.object({ label: z.string(), href: z.string() })

const docs = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/docs" }),
  schema: z.object({
    title: z.string(),
    crumb: z.string(),
    intro: z.string(),
    toc: z.array(z.object({ id: z.string(), label: z.string() })),
    prev: link,
    next: link,
  }),
})

export const collections = { docs }
