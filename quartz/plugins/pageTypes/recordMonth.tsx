import { QuartzPageTypePlugin } from "../types"
import { QuartzPluginData } from "../vfile"
import { QuartzComponent, QuartzComponentConstructor } from "../../components/types"
import { ProcessedContent } from "../vfile"

type RecordDate = {
  year: number
  month: number
  day: number
  key: string
  monthKey: string
}

function parseRecordDate(value: unknown): RecordDate | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear()
    const month = value.getUTCMonth() + 1
    const day = value.getUTCDate()

    return {
      year,
      month,
      day,
      key: formatDateKey(year, month, day),
      monthKey: formatMonthKey(year, month),
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

function formatMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function formatMonthTitle(monthKey: string): string {
  return monthKey.replace("-", ".")
}

function getRecordDate(page: QuartzPluginData): RecordDate | undefined {
  return (
    parseRecordDate(page.frontmatter?.date) ??
    parseRecordDate(page.slug) ??
    parseRecordDate(page.filePath)
  )
}

function getMonthKeyFromSlug(slug: string): string | undefined {
  const match = slug.match(/^(\d{4})-(\d{2})$/)
  if (!match) return undefined
  return `${match[1]}-${match[2]}`
}

function getRecordMonthKeys(content: ProcessedContent[]): string[] {
  return [
    ...new Set(
      content
        .map(([, file]) => getRecordDate(file.data)?.monthKey)
        .filter((monthKey): monthKey is string => Boolean(monthKey)),
    ),
  ].sort((a, b) => a.localeCompare(b))
}

const RecordMonthBody: QuartzComponent = () => {
  return <article class="popover-hint record-month-body" />
}

const RecordMonthBodyConstructor = (() => RecordMonthBody) satisfies QuartzComponentConstructor

export const RecordMonthPageType: QuartzPageTypePlugin = () => ({
  name: "record-month",
  priority: 20,
  match({ slug }) {
    return Boolean(getMonthKeyFromSlug(slug))
  },
  generate({ content }) {
    return getRecordMonthKeys(content).map((monthKey) => ({
      slug: monthKey,
      title: formatMonthTitle(monthKey),
      data: {
        recordMonthKey: monthKey,
      },
    }))
  },
  layout: "content",
  frame: "full-width",
  body: RecordMonthBodyConstructor,
})
