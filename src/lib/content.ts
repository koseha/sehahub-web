// 서버 전용 — 클라이언트 컴포넌트에서 import 금지.
// astro:content를 클라이언트 그래프에 끌어들이면 콘텐츠 전 항목(draft 포함)이 클라이언트 청크로 번들된다.
import { getCollection, type CollectionEntry } from "astro:content"

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
    .sort((a, b) => {
      // pinned 우선(projects 전용 필드 — blog는 전부 falsy) → 그 안에서 date 내림차순
      const pinDiff =
        Number(Boolean((b.data as { pinned?: boolean }).pinned)) -
        Number(Boolean((a.data as { pinned?: boolean }).pinned))
      return pinDiff !== 0 ? pinDiff : b.data.date.getTime() - a.data.date.getTime()
    })
}
