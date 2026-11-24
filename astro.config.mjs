import { defineConfig } from "astro/config"
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import tailwind from "@astrojs/tailwind"
import solidJs from "@astrojs/solid-js"

// https://astro.build/config
export default defineConfig({
  site: "https://sehahub.info",
  trailingSlash: "always",
  // 옛 /work/ 는 이력 쪽 /seha/ 로(2026-11-20 대표) — 이력서 · 프로필에 걸린 링크가 살아 있게
  redirects: {
    "/work/": "/seha/",
    // 내돈아님 소개는 팀 제품 사이트 /notmine/ 로 옮겼다(2026-11-20) — 앱스토어 「개발자 웹사이트」가 옛 주소를 가리킨다
    "/projects/notmine/": "/notmine/",
  },
  integrations: [
    mdx(),
    // 옛 방침 판(/…/privacy-v…/)은 공개 약속이라 쪽은 두고 사이트맵에서만 뺀다 — 「개인정보」 검색에 옛 판이 먼저 뜨지 않게(11/24 SEO)
    sitemap({ filter: (page) => !page.endsWith("/blog/") && !page.endsWith("/search/") && !/\/privacy-v\d/.test(page) }),
    solidJs(),
    tailwind({ applyBaseStyles: false }),
  ],
})