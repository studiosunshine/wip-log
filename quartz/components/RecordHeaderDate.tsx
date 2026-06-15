import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

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

function formatDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-")
  return `${year}.${month}.${day}`
}

const RecordHeaderDate: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const dateKey =
    parseDateKey(fileData.frontmatter?.date) ?? parseDateKey(fileData.slug) ?? parseDateKey(fileData.filePath)

  if (!dateKey || !fileData.slug || fileData.slug === "index") return null

  return (
    <time class="record-header-date" dateTime={dateKey}>
      {formatDateLabel(dateKey)}
    </time>
  )
}

export default (() => RecordHeaderDate) satisfies QuartzComponentConstructor
