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

function getLatestRecord(allFiles: QuartzPluginData[]): RecordEntry | undefined {
  return allFiles
    .map((page) => {
      const dateKey = getRecordDateKey(page)
      if (!dateKey || !page.slug || page.slug === "index" || page.slug === "studio-sunshine") return undefined
      return { dateKey, page }
    })
    .filter((entry): entry is RecordEntry => Boolean(entry))
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))[0]
}

const LatestRecordBackLink: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
  if (fileData.slug !== "studio-sunshine" || !fileData.slug) return null

  const latest = getLatestRecord(allFiles)
  if (!latest?.page.slug) return null

  const href = resolveRelative(fileData.slug, latest.page.slug as FullSlug)

  return (
    <p class="record-about-back">
      <a href={href} data-record-back-to-log>
        &lt; back to log
      </a>
    </p>
  )
}

export default (() => LatestRecordBackLink) satisfies QuartzComponentConstructor
