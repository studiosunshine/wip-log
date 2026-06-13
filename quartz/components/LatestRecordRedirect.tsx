import { FullSlug, resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

type RecordDate = {
  key: string
}

function parseDate(value: unknown): RecordDate | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return {
      key: `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
        value.getDate(),
      ).padStart(2, "0")}`,
    }
  }

  if (typeof value !== "string") return undefined

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return undefined

  return {
    key: `${match[1]}-${match[2]}-${match[3]}`,
  }
}

function getRecordDate(page: QuartzPluginData): RecordDate | undefined {
  return parseDate(page.frontmatter?.date) ?? parseDate(page.slug) ?? parseDate(page.filePath)
}

const LatestRecordRedirect: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
  if (fileData.slug !== "index") return null

  const latest = allFiles
    .filter((page) => page.slug && page.slug !== "index")
    .map((page) => ({ page, date: getRecordDate(page) }))
    .filter((entry): entry is { page: QuartzPluginData; date: RecordDate } => Boolean(entry.date))
    .sort((a, b) => b.date.key.localeCompare(a.date.key))[0]

  if (!latest?.page.slug) {
    return (
      <article class="latest-record-redirect">
        <p>아직 발행된 기록이 없습니다.</p>
      </article>
    )
  }

  const href = resolveRelative(fileData.slug, latest.page.slug as FullSlug)
  const title = latest.page.frontmatter?.title ?? latest.date.key

  return (
    <article class="latest-record-redirect">
      <p>가장 최근 기록으로 이동합니다.</p>
      <a href={href}>{title}</a>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace(${JSON.stringify(href)});`,
        }}
      />
    </article>
  )
}

export default (() => LatestRecordRedirect) satisfies QuartzComponentConstructor
