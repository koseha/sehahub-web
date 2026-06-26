import type { Site, Page, Links, Socials } from "@types"

// Global
export const SITE: Site = {
  TITLE: "sehahub",
  DESCRIPTION: "백엔드·인프라 중심 풀스택 개발자 seha의 작업물. 라이브 데모로 직접 만져볼 수 있습니다.",
  AUTHOR: "seha",
}

// Work Page
export const WORK: Page = {
  TITLE: "Work",
  DESCRIPTION: "지나온 경력.",
}

// Blog Page
export const BLOG: Page = {
  TITLE: "Blog",
  DESCRIPTION: "개발하며 정리한 글.",
}

// Projects Page
export const PROJECTS: Page = {
  TITLE: "Projects",
  DESCRIPTION: "직접 만든 작업물. 라이브 데모로 만져볼 수 있습니다.",
}

// Search Page
export const SEARCH: Page = {
  TITLE: "Search",
  DESCRIPTION: "글과 작업물을 키워드로 검색합니다.",
}

// Links
export const LINKS: Links = [
  {
    TEXT: "Home",
    HREF: "/",
  },
  {
    TEXT: "Projects",
    HREF: "/projects",
  },
  {
    TEXT: "Blog",
    HREF: "/blog",
  },
  {
    TEXT: "Work",
    HREF: "/work",
  },
]

// Socials
export const SOCIALS: Socials = [
  {
    NAME: "Email",
    ICON: "email",
    TEXT: "sehahub.info@gmail.com",
    HREF: "mailto:sehahub.info@gmail.com",
  },
  {
    NAME: "Github",
    ICON: "github",
    TEXT: "koseha",
    HREF: "https://github.com/koseha",
  },
]
