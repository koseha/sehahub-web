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
      // 라이브 데모 링크 — 트랙이 여럿이면 여러 개(버튼 라벨은 데이터가 든다)
      demos: z.array(z.object({ url: z.string(), label: z.string() })).optional(),
      storeUrl: z.string().optional(), // 앱 스토어 링크 — 스토어 URL은 demos가 아니라 이 필드에 (라벨 규약)
      releasesUrl: z.string().optional(), // 업데이트 내역(사이트 내부 라우트) — 대표 링크는 전부 헤더 링크 박스로
      repoUrl: z.string().optional(),
      period: z.string().optional(),
      team: z.string().optional(), // 상세용: 팀 구성 서술 (예: 웹 6명 → 모바일 8명)
      teamSize: z.string().optional(), // 카드용: 현재 규모 (예: 8명)
      badges: z.array(z.enum(["WEB", "MOBILE", "DEMO", "OSS"])).optional(),
      // 상세 상단 스크린샷 스트립 — 아일랜드 props로 직렬화 금지(fsPath 로컬 경로 유출)
      images: z.array(z.object({ src: image(), caption: z.string() })).optional(),
    }),
})

// 영어 · 일본어 판(2026-11-26) — 파일 = {lang}/{한국어 항목 이름}.md · 글만 둔다(사실은 한국어 항목에서 · src/lib/content.ts)
const projectsI18n = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    period: z.string().optional(),
    team: z.string().optional(),
    demos: z.array(z.string()).optional(), // 데모 버튼 이름 — 한국어 항목 demos 와 같은 차례
    captions: z.array(z.string()).optional(), // 그림 설명 — 한국어 항목 images 와 같은 차례
  }),
})

const workI18n = defineCollection({
  type: "content",
  schema: z.object({
    company: z.string(),
    role: z.string(),
    dateEnd: z.string().optional(), // 한국어 항목 dateEnd 가 글(「현재」)일 때만
  }),
})

export const collections = { work, blog, projects, "projects-i18n": projectsI18n, "work-i18n": workI18n }
