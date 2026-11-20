import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// formatDate · readingTime · truncateText 는 2026-11-20 개편으로 쓰는 곳이 없어져 지웠다(옛 블로그 · 카드 · 상세 머리)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
