import { defineCollection, z } from "astro:content"

const work = defineCollection({
  type: "content",
  schema: z.object({
    company: z.string(),
    role: z.string(),
    dateStart: z.coerce.date(),
    dateEnd: z.union([z.coerce.date(), z.string()]),
  }),
})

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    draft: z.boolean().optional(),
  }),
})

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    draft: z.boolean().optional(),
    demoUrl: z.string().optional(),
    repoUrl: z.string().optional(),
    period: z.string().optional(),
    team: z.string().optional(), // 상세용: 팀 구성 서술 (예: 웹 6명 → 모바일 8명)
    teamSize: z.string().optional(), // 카드용: 현재 규모 (예: 8명)
    badges: z.array(z.enum(["WEB", "MOBILE", "DEMO", "OSS"])).optional(),
  }),
})

export const collections = { work, blog, projects }
