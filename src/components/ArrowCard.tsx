import { formatDate, truncateText } from "@lib/utils"
import type { CollectionEntry } from "astro:content"
import { isProject } from "@types"

type Props = {
  entry: CollectionEntry<"blog"> | CollectionEntry<"projects">
  pill?: boolean
}

export default function ArrowCard({ entry, pill }: Props) {
  const period = isProject(entry) ? entry.data.period : undefined
  const teamSize = isProject(entry) ? entry.data.teamSize : undefined
  const badges = isProject(entry) ? entry.data.badges : undefined
  return (
    <a href={`/${entry.collection}/${entry.slug}`} class="group card-link">
      <div class="w-full group-hover:text-black group-hover:dark:text-white blend">
        <div class="flex flex-wrap items-center gap-2">
          {pill &&
            <div class="text-sm capitalize px-2 py-0.5 rounded-full border border-black/15 dark:border-white/25">
              {entry.collection === "blog" ? "post" : "project"}
            </div>
          }
          <div class="text-sm uppercase">
            {period ?? formatDate(entry.data.date)}
          </div>
          {teamSize &&
            <div class="flex items-center gap-1.5 text-sm uppercase border-l border-black/15 dark:border-white/25 pl-3">
              <svg class="size-4 stroke-current" aria-hidden="true">
                <use href="/ui.svg#users"/>
              </svg>
              <span class="sr-only">팀 규모 </span>{teamSize}
            </div>
          }
        </div>
        <div class="font-semibold mt-3 text-black dark:text-white line-clamp-2">
          {entry.data.title}
        </div>

        <div class="text-sm line-clamp-2">
          {entry.data.summary}
        </div>
        {badges && badges.length > 0 &&
          <ul class="flex flex-wrap mt-2 gap-1">
            {badges.map((b: string) => (
              <li class="pill pill-outline">
                {b}
              </li>
            ))}
          </ul>
        }
        <ul class="flex flex-wrap mt-2 gap-1">
          {entry.data.tags.map((tag: string) => ( // this line has an error; Parameter 'tag' implicitly has an 'any' type.ts(7006)
            <li class="pill pill-muted">
              {truncateText(tag, 20)}
            </li>
          ))}
        </ul>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="stroke-current group-hover:stroke-black group-hover:dark:stroke-white">
        <line x1="5" y1="12" x2="19" y2="12" class="scale-x-0 group-hover:scale-x-100 translate-x-4 group-hover:translate-x-1 transition-all duration-300 ease-in-out" />
        <polyline points="12 5 19 12 12 19" class="translate-x-0 group-hover:translate-x-1 transition-all duration-300 ease-in-out" />
      </svg>
    </a>
  )
}