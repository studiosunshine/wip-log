import { FullSlug, resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

type RecordEntry = {
  dateKey: string
  page: QuartzPluginData
}

function parseDateKey(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(
      value.getUTCDate(),
    ).padStart(2, "0")}`
  }

  if (typeof value !== "string") return undefined

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return undefined

  return `${match[1]}-${match[2]}-${match[3]}`
}

function getRecordDateKey(page: QuartzPluginData): string | undefined {
  return parseDateKey(page.frontmatter?.date) ?? parseDateKey(page.slug) ?? parseDateKey(page.filePath)
}

function getRecordEntries(allFiles: QuartzPluginData[]): RecordEntry[] {
  return allFiles
    .map((page) => {
      const dateKey = getRecordDateKey(page)
      if (!dateKey || !page.slug || page.slug === "index" || !page.frontmatter?.title) return undefined
      return { dateKey, page }
    })
    .filter((entry): entry is RecordEntry => Boolean(entry))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
}

const RecordPager: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
  const currentDateKey = getRecordDateKey(fileData)
  if (!currentDateKey || !fileData.slug || fileData.slug === "index") return null

  const records = getRecordEntries(allFiles)
  const currentIndex = records.findIndex((entry) => entry.page.slug === fileData.slug)
  if (currentIndex < 0) return null

  const previousRecord = records[currentIndex - 1]
  const nextRecord = records[currentIndex + 1]

  if (!previousRecord && !nextRecord) return null

  const previousHref = previousRecord ? resolveRelative(fileData.slug, previousRecord.page.slug! as FullSlug) : undefined
  const nextHref = nextRecord ? resolveRelative(fileData.slug, nextRecord.page.slug! as FullSlug) : undefined

  return (
    <nav class="record-edge-nav" aria-label="기록 이동">
      {previousHref ? (
        <a
          class="record-edge-nav-link is-previous"
          href={previousHref}
          aria-label={`이전 기록: ${previousRecord.page.frontmatter?.title ?? previousRecord.dateKey}`}
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
          aria-label={`다음 기록: ${nextRecord.page.frontmatter?.title ?? nextRecord.dateKey}`}
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

export default (() => RecordPager) satisfies QuartzComponentConstructor
