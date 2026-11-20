import type { CollectionEntry } from "astro:content"

export type Page = {
  TITLE: string
  DESCRIPTION: string
}

export interface Site extends Page {
  AUTHOR: string
}

export function isProject(
  entry: CollectionEntry<"blog"> | CollectionEntry<"projects">
): entry is CollectionEntry<"projects"> {
  return entry.collection === "projects"
}

export function isPinned(
  entry: CollectionEntry<"blog"> | CollectionEntry<"projects">
): boolean {
  return isProject(entry) && Boolean(entry.data.pinned)
}
