import { defineCollection, z } from "astro:content"

const work = defineCollection({
  type: "content",
  schema: z.object({
    company: z.string(),
    role: z.string(),
    dateStart: z.coerce.date(),
    dateEnd: z.union([z.coerce.date(), z.string()]),
    stack: z.array(z.string()).optional(),
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
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      date: z.coerce.date(),
      tags: z.array(z.string()),
      draft: z.boolean().optional(),
      pinned: z.boolean().optional(), // 목록·메인 상단 고정 (정렬 토글 무관)
      demoUrl: z.string().optional(),
      repoUrl: z.string().optional(),
      period: z.string().optional(),
      team: z.string().optional(), // 상세용: 팀 구성 서술 (예: 웹 6명 → 모바일 8명)
      teamSize: z.string().optional(), // 카드용: 현재 규모 (예: 8명)
      badges: z.array(z.enum(["WEB", "MOBILE", "DEMO", "OSS"])).optional(),
      // 상세 상단 스크린샷 스트립 — 아일랜드 props로 직렬화 금지(fsPath 로컬 경로 유출)
      images: z.array(z.object({ src: image(), caption: z.string() })).optional(),
    }),
})

export const collections = { work, blog, projects }
