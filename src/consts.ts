import type { Site, Page } from "@types"

// Global — 설명은 쪽에 보이지 않고 검색 · 공유 미리보기에만 쓰인다. 시키지 않은 문구를 넣지 않는다(2026-11-20 · 그룹 지식 §2)
export const SITE: Site = {
  TITLE: "sehahub",
  DESCRIPTION: "sehahub가 만든 앱.",
  AUTHOR: "seha",
}

// Projects Page — 기간이 있던 작업 · 실험(Products 는 홈)
export const PROJECTS: Page = {
  TITLE: "Projects",
  DESCRIPTION: "sehahub의 지난 프로젝트.",
}

// 2026-11-20 개편 — Blog · Search · Work(→ /seha/) 쪽과 옛 머리 메뉴 · 바닥 링크 상수(LINKS · SOCIALS)를 뺐다
