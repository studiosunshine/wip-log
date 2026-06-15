import { FullSlug, resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { QuartzComponent, QuartzComponentProps } from "./types"

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
      key: formatKey(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate()),
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
    key: formatKey(year, month, day),
    monthKey: formatMonthKey(year, month),
  }
}

function formatMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`
}

function formatKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function formatMonth(year: number, month: number): string {
  return `${year}.${String(month).padStart(2, "0")}`
}

const WEEKDAYS = ["s", "m", "t", "w", "t", "f", "s"]

function getRecordDate(page: QuartzPluginData): RecordEntry["date"] | undefined {
  return parseDate(page.frontmatter?.date) ?? parseDate(page.slug) ?? parseDate(page.filePath)
}

function getRecordEntries(allFiles: QuartzPluginData[]): RecordEntry[] {
  return allFiles
    .map((page) => {
      const date = getRecordDate(page)
      if (!date || !page.slug || !page.frontmatter?.title) return undefined
      return { date, page }
    })
    .filter((entry): entry is RecordEntry => Boolean(entry))
    .sort((a, b) => a.date.key.localeCompare(b.date.key))
}

function getMonthLink(
  records: RecordEntry[],
  monthKey: string,
  direction: "previous" | "next",
): RecordEntry | undefined {
  const entries = records.filter((entry) => entry.date.monthKey === monthKey)
  if (direction === "previous") return entries[entries.length - 1]
  return entries[0]
}

export default function RecordCalendar(): QuartzComponent {
  const Component: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
    const currentDate = getRecordDate(fileData)
    if (!currentDate) return null

    const records = getRecordEntries(allFiles)
    const recordsByDay = new Map<number, RecordEntry>()
    for (const entry of records) {
      if (entry.date.year === currentDate.year && entry.date.month === currentDate.month) {
        recordsByDay.set(entry.date.day, entry)
      }
    }

    if (recordsByDay.size === 0) return null

    const monthKeys = [...new Set(records.map((entry) => entry.date.monthKey))]
    const currentMonthIndex = monthKeys.indexOf(currentDate.monthKey)
    const previousMonthKey = currentMonthIndex > 0 ? monthKeys[currentMonthIndex - 1] : undefined
    const nextMonthKey =
      currentMonthIndex >= 0 && currentMonthIndex < monthKeys.length - 1
        ? monthKeys[currentMonthIndex + 1]
        : undefined
    const previousMonthEntry = previousMonthKey
      ? getMonthLink(records, previousMonthKey, "previous")
      : undefined
    const nextMonthEntry = nextMonthKey ? getMonthLink(records, nextMonthKey, "next") : undefined
    const previousMonthHref = previousMonthEntry
      ? resolveRelative(fileData.slug!, previousMonthEntry.page.slug! as FullSlug)
      : undefined
    const nextMonthHref = nextMonthEntry
      ? resolveRelative(fileData.slug!, nextMonthEntry.page.slug! as FullSlug)
      : undefined

    const firstWeekday = new Date(Date.UTC(currentDate.year, currentDate.month - 1, 1)).getUTCDay()
    const monthPageSlug = currentDate.monthKey as FullSlug
    const monthPageHref = resolveRelative(fileData.slug!, monthPageSlug)
    const daysInMonth = new Date(Date.UTC(currentDate.year, currentDate.month, 0)).getUTCDate()
    const cells = []

    for (let i = 0; i < firstWeekday; i += 1) {
      cells.push(<span class="record-calendar-day is-empty" aria-hidden="true" />)
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const entry = recordsByDay.get(day)
      const isCurrentDay = day === currentDate.day
      const label = String(day).padStart(2, "0")

      if (entry) {
        const href = resolveRelative(fileData.slug!, entry.page.slug! as FullSlug)
        const title = entry.page.frontmatter?.title ?? label
        cells.push(
          <a
            class={`record-calendar-day has-record${isCurrentDay ? " is-current" : ""}`}
            href={href}
            aria-label={`${currentDate.month}월 ${day}일 기록: ${title}`}
          >
            <span>{label}</span>
          </a>,
        )
      } else {
        cells.push(
          <span class={`record-calendar-day${isCurrentDay ? " is-current" : ""}`}>
            <span>{label}</span>
          </span>,
        )
      }
    }

    return (
      <section
        class="record-calendar"
        aria-label={`${formatMonth(currentDate.year, currentDate.month)} 기록 달력`}
      >
        <div class="record-calendar-nav">
          {previousMonthHref ? (
            <a
              class="record-calendar-month-link is-previous"
              href={previousMonthHref}
              aria-label={`${previousMonthKey} 기록으로 이동`}
            >
              ◂
            </a>
          ) : (
            <span class="record-calendar-month-link is-previous is-disabled" aria-hidden="true">
              ◂
            </span>
          )}
          <h2>
            <a
              class="record-calendar-month-title"
              href={monthPageHref}
              aria-label={`${formatMonth(currentDate.year, currentDate.month)} 기록 목록`}
            >
              {formatMonth(currentDate.year, currentDate.month)}
            </a>
          </h2>
          {nextMonthHref ? (
            <a
              class="record-calendar-month-link is-next"
              href={nextMonthHref}
              aria-label={`${nextMonthKey} 기록으로 이동`}
            >
              ▸
            </a>
          ) : (
            <span class="record-calendar-month-link is-next is-disabled" aria-hidden="true">
              ▸
            </span>
          )}
        </div>
        <div class="record-calendar-weekdays" aria-hidden="true">
          {WEEKDAYS.map((weekday) => (
            <span>{weekday}</span>
          ))}
        </div>
        <div class="record-calendar-grid">{cells}</div>
      </section>
    )
  }

  return Component
}
