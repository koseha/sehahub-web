// 목록 카드가 쓰는 레이아웃 기하의 단일 출처.
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

/** Container 좌우 패딩(px). ⚠️ Container.astro 의 `px-5` 와 손으로 맞춘 값이다 — 그쪽 프론트매터에 역참조 주석을 두었다. */
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
