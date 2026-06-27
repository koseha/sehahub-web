import type { Site, Page, Links, Socials } from "@types"

// Global
export const SITE: Site = {
  TITLE: "sehahub",
  DESCRIPTION: "백엔드·인프라와 관리자 백오피스를 직접 구축하는 개발자 새하(seha)의 포트폴리오. 모든 작업물은 라이브 데모로 직접 경험할 수 있습니다.",
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
  DESCRIPTION: "생각은 덜어내고, 배운 것은 선명하게 기록합니다.",
}

// Projects Page
export const PROJECTS: Page = {
  TITLE: "Projects",
  DESCRIPTION: "생각을 코드로 옮긴 결과물. 모든 프로젝트는 라이브 데모로 직접 경험할 수 있습니다.",
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
    NAME: "GitHub",
    ICON: "github",
    TEXT: "koseha",
    HREF: "https://github.com/koseha",
  },
]
