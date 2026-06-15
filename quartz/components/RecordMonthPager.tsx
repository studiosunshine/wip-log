import { FullSlug, resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

type MonthEntry = {
  monthKey: string
  page: QuartzPluginData
}

function parseMonthKey(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined

  const match = value.match(/^(\d{4})-(\d{2})$/)
  if (!match) return undefined

  return `${match[1]}-${match[2]}`
}

function formatMonthLabel(monthKey: string): string {
  return monthKey.replace("-", ".")
}

function getMonthKey(page: QuartzPluginData): string | undefined {
  return parseMonthKey(page.slug)
}

function getMonthEntries(allFiles: QuartzPluginData[]): MonthEntry[] {
  return allFiles
    .map((page) => {
      const monthKey = getMonthKey(page)
      if (!monthKey || !page.slug || !page.frontmatter?.title) return undefined
      return { monthKey, page }
    })
    .filter((entry): entry is MonthEntry => Boolean(entry))
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
}

const RecordMonthPager: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
  const currentMonthKey = getMonthKey(fileData)
  if (!currentMonthKey || !fileData.slug) return null

  const months = getMonthEntries(allFiles)
  const currentIndex = months.findIndex((entry) => entry.page.slug === fileData.slug)
  if (currentIndex < 0) return null

  const previousMonth = months[currentIndex - 1]
  const nextMonth = months[currentIndex + 1]

  if (!previousMonth && !nextMonth) return null

  const previousHref = previousMonth
    ? resolveRelative(fileData.slug, previousMonth.page.slug! as FullSlug)
    : undefined
  const nextHref = nextMonth
    ? resolveRelative(fileData.slug, nextMonth.page.slug! as FullSlug)
    : undefined

  return (
    <nav class="record-edge-nav" aria-label="월별 기록 이동">
      {previousHref ? (
        <a
          class="record-edge-nav-link is-previous"
          href={previousHref}
          aria-label={`이전 달 기록: ${formatMonthLabel(previousMonth.monthKey)}`}
        >
          <span aria-hidden="true">◁</span>
        </a>
      ) : (
        <span class="record-edge-nav-link is-previous is-disabled" aria-hidden="true">
          <span>◁</span>
        </span>
      )}
      {nextHref ? (
        <a
          class="record-edge-nav-link is-next"
          href={nextHref}
          aria-label={`다음 달 기록: ${formatMonthLabel(nextMonth.monthKey)}`}
        >
          <span aria-hidden="true">▷</span>
        </a>
      ) : (
        <span class="record-edge-nav-link is-next is-disabled" aria-hidden="true">
          <span>▷</span>
        </span>
      )}
    </nav>
  )
}

export default (() => RecordMonthPager) satisfies QuartzComponentConstructor
