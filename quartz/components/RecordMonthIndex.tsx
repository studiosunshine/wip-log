import { FullSlug, resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

type RecordEntry = {
  date: {
    year: number
    month: number
    day: number
    key: string
    monthKey: string
  }
  page: QuartzPluginData
}

function parseDate(value: unknown): RecordEntry["date"] | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return {
      year: value.getUTCFullYear(),
      month: value.getUTCMonth() + 1,
      day: value.getUTCDate(),
      key: formatDateKey(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate()),
      monthKey: formatMonthKey(value.getUTCFullYear(), value.getUTCMonth() + 1),
    }
  }

  if (typeof value !== "string") return undefined

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return undefined

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!year || !month || !day) return undefined

  return {
    year,
    month,
    day,
    key: formatDateKey(year, month, day),
    monthKey: formatMonthKey(year, month),
  }
}

function parseMonthKey(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined

  const match = value.match(/^(\d{4})-(\d{2})$/)
  if (!match) return undefined

  return `${match[1]}-${match[2]}`
}

function formatMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function formatDateLabel(date: RecordEntry["date"]): string {
  return `${date.year}.${String(date.month).padStart(2, "0")}.${String(date.day).padStart(2, "0")}`
}

function getRecordDate(page: QuartzPluginData): RecordEntry["date"] | undefined {
  return parseDate(page.frontmatter?.date) ?? parseDate(page.slug) ?? parseDate(page.filePath)
}

function getRecordEntries(allFiles: QuartzPluginData[]): RecordEntry[] {
  return allFiles
    .map((page) => {
      const date = getRecordDate(page)
      if (!date || !page.slug || page.slug === "index" || !page.frontmatter?.title) return undefined
      return { date, page }
    })
    .filter((entry): entry is RecordEntry => Boolean(entry))
    .sort((a, b) => a.date.key.localeCompare(b.date.key))
}

function getMonthKey(fileData: QuartzPluginData): string | undefined {
  return parseMonthKey(fileData.slug) ?? parseMonthKey(fileData.filePath)
}

const RecordMonthIndex: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
  const monthKey = getMonthKey(fileData)
  if (!monthKey || !fileData.slug) return null

  const records = getRecordEntries(allFiles).filter((entry) => entry.date.monthKey === monthKey)

  return (
    <section class="record-month-index" aria-label={`${fileData.frontmatter?.title ?? monthKey} 기록 목록`}>
      {records.length > 0 ? (
        <ol class="record-month-list">
          {records.map((entry) => {
            const href = resolveRelative(fileData.slug!, entry.page.slug! as FullSlug)
            const title = entry.page.frontmatter?.title ?? formatDateLabel(entry.date)

            return (
              <li>
                <time class="record-month-date" dateTime={entry.date.key}>
                  {formatDateLabel(entry.date)}
                </time>
                <a class="record-month-link" href={href}>
                  {title}
                </a>
              </li>
            )
          })}
        </ol>
      ) : (
        <p class="record-month-empty">아직 이 달의 기록이 없습니다.</p>
      )}
    </section>
  )
}

export default (() => RecordMonthIndex) satisfies QuartzComponentConstructor
