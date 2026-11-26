// 서버 전용 — 클라이언트 컴포넌트에서 import 금지.
// astro:content를 클라이언트 그래프에 끌어들이면 콘텐츠 전 항목(draft 포함)이 클라이언트 청크로 번들된다.
import { getCollection, type CollectionEntry } from "astro:content"
import { isPinned } from "@types"
import type { Lang } from "@i18n"

// draft 미리보기는 로컬 .env의 SHOW_DRAFTS=true로만 켠다 (dev 전용 — 빌드는 DEV 게이트로 항상 차단)
const SHOW_DRAFTS = import.meta.env.DEV && String(import.meta.env.SHOW_DRAFTS) === "true"

export function isPublished(entry: { data: { draft?: boolean } }) {
  return !entry.data.draft || SHOW_DRAFTS
}

export async function getSortedEntries<C extends "blog" | "projects">(
  collection: C
): Promise<CollectionEntry<C>[]> {
  return (await getCollection(collection))
    .filter(isPublished)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
}

// 표시(목록·메인) 전용 — 상세 페이지 prev/next 등 시간순 소비자에는 적용하지 말 것
export function pinnedFirst<E extends CollectionEntry<"blog"> | CollectionEntry<"projects">>(
  entries: E[]
): E[] {
  return [...entries.filter(isPinned), ...entries.filter((entry) => !isPinned(entry))]
}

// 영어 · 일본어 판(2026-11-26) — 글만 src/content/projects-i18n/{lang}/{slug}.md 에 둔다.
// 사실(날짜 · 스택 · 링크 · 그림)은 한국어 항목에서 가져온다 · 데모 이름 · 그림 설명은 한국어 항목과 같은 차례.
// 번역이 없는 프로젝트는 그 언어 쪽에 내지 않는다(한글이 섞인 쪽을 만들지 않게).
export async function localizeProjects(lang: Lang, entries: CollectionEntry<"projects">[]) {
  const tr = lang === "ko" ? [] : await getCollection("projects-i18n", (t) => t.slug.startsWith(`${lang}/`))
  return entries.flatMap((entry) => {
    const t = tr.find((x) => x.slug === `${lang}/${entry.slug}`)
    if (lang !== "ko" && !t) return []
    const d = entry.data
    return [{
      entry,
      slug: entry.slug,
      title: t?.data.title ?? d.title,
      summary: t?.data.summary ?? d.summary,
      period: t?.data.period ?? d.period,
      team: t?.data.team ?? d.team,
      demos: (d.demos ?? []).map((demo, i) => ({ ...demo, label: t?.data.demos?.[i] ?? demo.label })),
      images: (d.images ?? []).map((img, i) => ({ ...img, caption: t?.data.captions?.[i] ?? img.caption })),
      body: t ?? entry,
    }]
  })
}
export type ProjectView = Awaited<ReturnType<typeof localizeProjects>>[number]
