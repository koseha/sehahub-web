// 목록 카드와 상세 스크린샷이 공유하는 레이아웃 기하·이미지 사다리의 단일 출처.
// ⚠️ Astro 프론트매터 전용 — client 컴포넌트(Search.tsx 등)에서 import 하지 말 것.
//
// tailwind.config.mjs 를 직접 import 하지 않는다: 그 파일이 ESM(.mjs)인데
// plugins 에서 require() 를 써서 Vite 경로로 평가하면 ReferenceError 가 난다.
// tailwind 자신은 jiti 로 읽어 오늘 동작하는 것뿐이다.
//
// ⚠️ 그 대가: theme.extend.screens 로 브레이크포인트를 커스텀하면 Container 의
//    max-w-screen-* 는 따라가는데 여기는 기본값에 남아 거짓이 된다. 그때는 이 파일도 같이 고칠 것.
//    (오늘 tailwind.config.mjs 에 screens 재정의 없음 — 확인함)
import defaultTheme from "tailwindcss/defaultTheme"

const SCREENS = defaultTheme.screens as Record<string, string>
type ContainerSize = keyof typeof defaultTheme.screens

/** Container 좌우 패딩(px). ⚠️ `Container.astro` 의 `px-5` 와 손으로 맞춘 값이다 — 그쪽 프론트매터에 역참조 주석을 두었다. */
export const CONTAINER_PX = 20

/** 카드 루트 border 폭(px) — ProjectCard 루트의 `border` */
export const CARD_BORDER = 1

/** BottomLayout 이 쓰는 Container size. BottomLayout.astro 와 ProjectCard.astro 가 이 값을 공유한다. */
export const BOTTOM_CONTAINER_SIZE = "md" as const

/** 해당 size 의 브레이크포인트 폭(px) */
export function containerBreakpoint(size: ContainerSize): number {
  return parseInt(SCREENS[size], 10)
}

/** 해당 size 의 Container 안쪽 콘텐츠 폭(px) */
export function containerContentWidth(size: ContainerSize): number {
  return containerBreakpoint(size) - CONTAINER_PX * 2
}

// ── 카드 배너 기하 · 이미지 후보 사다리 ──────────────────────────────────
// 🔴 목록 카드와 상세 스크린샷 스트립이 이 산출을 공유한다. 같은 폭을 요청하면
//    Astro 가 같은 파일을 내주므로(DEFAULT_HASH_PROPS 에 sizes·class 없음)
//    목록을 거쳐 온 방문자에게 상세 이미지가 캐시 히트한다.
// ⚠️ 여기서 "슬롯" = 배너 캐러셀 한 칸, 이미지 1장이 차지하는 자리(`ProjectCard.astro` 의
//    `.snap-center` div). 상세는 캐러셀이 아니지만 같은 사다리를 요청해 파일을 공유한다.

/** 배너 높이 상한 */
const BANNER_MAX_H = 460
/** 휴대폰 최대 뷰포트 — 사다리의 모바일 앵커 */
const PHONE_VW = 430

/** 카드 배너 내부 폭 = Container 콘텐츠 폭. ⚠️ `ProjectCard.astro` 의 `aspect-ratio` 와 아래 slotFrac 의 분모가 같은 값이어야 한다. */
export const BANNER_W = containerContentWidth(BOTTOM_CONTAINER_SIZE) // 768 - 20×2 = 728
/** 모바일에서 뷰포트에 깎이는 폭(Container 패딩 + 카드 border). `ProjectCard.astro` 의 sizes 가 그대로 쓴다. */
export const CARD_GUTTER = CONTAINER_PX * 2 + CARD_BORDER * 2 // 42
const CARD_W = BANNER_W - CARD_BORDER * 2 // 726
const PHONE_W = PHONE_VW - CARD_GUTTER

/**
 * 배너 높이 = 카드 첫 장을 다 담는 높이(상한 BANNER_MAX_H).
 * 캐러셀은 높이가 하나여야 하므로 카드 단위가 유일한 답이다.
 * ⚠️ 그래서 이미지 순서를 바꾸면 그 카드 전 슬롯의 sizes·widths 가 함께 달라진다.
 */
export function bannerHeight(first: ImageMetadata) {
  return Math.min(BANNER_MAX_H, Math.round(BANNER_W / (first.width / first.height)))
}

/**
 * 배너 높이 안에서 object-contain 이 실제로 그리는 폭의 비율. 배너 폭이 상한.
 * 🔴 슬롯별이다 — 카드 단위로 두면 종횡비가 섞인 카드에서 2번째 장부터
 *    선언이 실그림과 어긋난다(가로 먼저 + 세로 나중이면 3.46배 과대).
 * 🔴 반올림하지 않는다: `ProjectCard.astro` 의 인라인 style 이 이 값을 그대로 쓰고
 *    (`toFixed(3)`), sizes 쪽만 slotAnchors 에서 4자리로 접는다.
 */
export function slotFrac(first: ImageMetadata, img: ImageMetadata) {
  const h = bannerHeight(first)
  return Math.min(BANNER_W, Math.round(h * (img.width / img.height))) / BANNER_W
}

/**
 * sizes 에 나가는 값과 후보 산출에 쓰는 값을 같은 수에서 뽑는 단일 출처.
 * 🔴 둘이 갈리면 앵커가 한 끗 차이로 빗나가 과대율이 1.00 → 1.50 으로 점프한다.
 */
export function slotAnchors(first: ImageMetadata, img: ImageMetadata) {
  const fracS = Number(slotFrac(first, img).toFixed(4))
  return {
    fracS,
    deskPx: Math.ceil(CARD_W * fracS),
    mobPx: Math.ceil(PHONE_W * fracS),
  }
}

/**
 * 이 이미지가 목록 카드에서 받는 후보 사다리.
 * 🔴 상세 스크린샷도 같은 값을 요청해 파일을 공유한다(캐시 히트) — 그래서 앵커가
 *    상세 기하가 아니라 **목록 기하**(CARD_W·PHONE_W)에서 나온다. 상세 호출자가
 *    알아야 하는 비대칭이다.
 * sizes 두 분기에 각각 앵커를 두고 DPR 1~3 을 깐다. 15% 이내로 붙는 후보는 큰 쪽만 남긴다.
 * 데스크톱에만 앵커를 두면 휴대폰 요구폭이 사다리에서 가장 넓은 간격 한복판에 떨어진다.
 */
export function slotWidths(first: ImageMetadata, img: ImageMetadata) {
  const { deskPx, mobPx } = slotAnchors(first, img)
  const raw = [mobPx * 2, mobPx * 3, deskPx, deskPx * 2, deskPx * 3]
  // 클램프를 dedupe 보다 먼저 — 뒤집히면 원본보다 큰 폭이 남아 descriptor 가 거짓이 된다
  const c = [...new Set(raw.map((w) => Math.min(w, img.width)))].sort((a, b) => a - b)
  // 직전에 "채택한" 값과 비교한다. 원본 이웃과 비교하면 15% 이내가 연쇄될 때
  // 살아남은 계단 사이가 1.15 를 넘어버린다(예: [100,114,130,148,169] → [169])
  const kept: number[] = []
  for (let i = c.length - 1; i >= 0; i--) {
    if (kept.length === 0 || kept[kept.length - 1] / c[i] > 1.15) kept.push(c[i])
  }
  return kept.reverse()
}
