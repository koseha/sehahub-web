// 언어(2026-11-26 대표 「한글/영어 지원 … 일본어도 가능하면」) — 그룹 쪽(홈 · Projects · 프로젝트 상세 · /seha/)만.
// 한국어 = 뿌리 주소 그대로(앱스토어 · 이력서가 거는 주소) · 영어 = /en/… · 일본어 = /ja/…
// 🔴 기기 언어를 보고 저절로 보내지 않는다 — 검색 로봇이 주소마다 그 쪽을 그대로 보게. 머리의 언어 버튼으로만 바꾼다.
// 팀 쪽(내돈아님 · 운동해 넵 · 지구 청소)은 팀 몫이라 여기 없다.
import { SITE, PROJECTS } from "@consts"

export const LANGS = ["ko", "en", "ja"] as const
export type Lang = (typeof LANGS)[number]
export type Alternates = Partial<Record<Lang, string>>

// 언어 버튼 차림 — 그 언어로 쓴 이름
export const LANG_NAMES: Record<Lang, string> = { ko: "한국어", en: "English", ja: "日本語" }

export const localePath = (lang: Lang, path: string) => (lang === "ko" ? path : `/${lang}${path}`)
export const alternatesOf = (path: string, langs: readonly Lang[] = LANGS): Alternates =>
  Object.fromEntries(langs.map((l) => [l, localePath(l, path)]))

// src/pages/[...lang]/ 쪽들 — 한국어는 lang 이 비어 뿌리 주소로 나온다
export const langParam = (lang: Lang) => (lang === "ko" ? undefined : lang)

// 쪽에 이미 있던 글만 옮긴다 — 새 문구를 넣지 않는다(그룹 지식 §2). 머리의 Products · Projects · Next 는 모든 언어에서 영어 그대로.
export const ui = {
  ko: {
    siteDescription: SITE.DESCRIPTION,
    projectsDescription: PROJECTS.DESCRIPTION,
    releases: "업데이트 내역",
    repo: "저장소",
    stack: "스택",
    screenshots: "스크린샷",
    skills: "주로 다루는 기술",
    skillsJob: "현업",
    skillsWork: "작업물",
    github: "GitHub · koseha",
  },
  en: {
    siteDescription: "Apps by sehahub — 내돈아님 and RepYep.",
    projectsDescription: "Past projects from sehahub.",
    releases: "Release notes",
    repo: "Repository",
    stack: "Stack",
    screenshots: "Screenshots",
    skills: "Main technologies",
    skillsJob: "At work",
    skillsWork: "In projects",
    github: "GitHub (koseha)",
  },
  ja: {
    siteDescription: "sehahubが作ったアプリ：내돈아님、RepYep。",
    projectsDescription: "sehahubのこれまでのプロジェクト。",
    releases: "更新履歴",
    repo: "リポジトリ",
    stack: "技術スタック",
    screenshots: "スクリーンショット",
    skills: "主に扱う技術",
    skillsJob: "実務",
    skillsWork: "プロジェクト",
    github: "GitHub (koseha)",
  },
} satisfies Record<Lang, Record<string, string>>
