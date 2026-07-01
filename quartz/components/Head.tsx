import { i18n } from "../i18n"
import { FullSlug, getFileExtension, joinSegments, pathToRoot } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"
import { CustomOgImagesEmitterName } from "../../.quartz/plugins"

const initialBackgroundColor = "#fffdf7"
const author = {
  "@type": "Person",
  name: "방해리",
  url: "https://litt.ly/hreecord",
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined
}

function isAbsoluteUrl(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value)
}

function toSeoDate(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

    const date = new Date(trimmed)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
  }

  return undefined
}

function isRecordSlug(slug: unknown): boolean {
  return typeof slug === "string" && /^\d{4}-\d{2}-\d{2}$/.test(slug)
}

function jsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}

export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
    ctx,
  }: QuartzComponentProps) => {
    const titleSuffix = cfg.pageTitleSuffix ?? ""
    const title =
      (fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title) + titleSuffix
    const description =
      fileData.frontmatter?.socialDescription ??
      fileData.frontmatter?.description ??
      unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description)
    const frontmatter = fileData.frontmatter as Record<string, unknown> | undefined

    const { css, js, additionalHead } = externalResources

    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
    const path = url.pathname as FullSlug
    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    const iconPath = joinSegments(baseDir, "static/icon.png")

    // Url of current page
    const socialUrl =
      fileData.slug === "404" ? url.toString() : joinSegments(url.toString(), fileData.slug!)
    let canonicalUrl: string | undefined
    if (cfg.baseUrl && fileData.slug !== "404") {
      if (fileData.slug === "index") {
        canonicalUrl = joinSegments(url.toString(), "/")
      } else if (fileData.slug?.endsWith("/index")) {
        canonicalUrl = joinSegments(url.toString(), fileData.slug.replace(/\/index$/, ""), "/")
      } else if (fileData.slug) {
        canonicalUrl = joinSegments(url.toString(), fileData.slug)
      }
    }
    const pageUrl = canonicalUrl ?? socialUrl
    const siteUrl = joinSegments(url.toString(), "/")

    const usesCustomOgImage = ctx.cfg.plugins.emitters.some(
      (e) => e.name === CustomOgImagesEmitterName,
    )
    const ogImageDefaultPath = `https://${cfg.baseUrl}/static/og-image.png`
    const userOgImage = asString(frontmatter?.socialImage)
    const ogImagePath = userOgImage
      ? isAbsoluteUrl(userOgImage)
        ? userOgImage
        : `https://${cfg.baseUrl}/static/${userOgImage}`
      : usesCustomOgImage && fileData.filePath && fileData.slug
        ? `https://${cfg.baseUrl}/${fileData.slug}-og-image.webp`
        : ogImageDefaultPath
    const publishedDate = toSeoDate(frontmatter?.published) ?? toSeoDate(frontmatter?.date)
    const modifiedDate = toSeoDate(frontmatter?.modified) ?? toSeoDate(fileData.dates?.modified)
    const isRecordPage = Boolean(publishedDate || isRecordSlug(fileData.slug))
    const ogType = isRecordPage ? "article" : "website"
    const structuredData = isRecordPage
      ? {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: title,
          description,
          url: pageUrl,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": pageUrl,
          },
          image: [ogImagePath],
          datePublished: publishedDate,
          dateModified: modifiedDate ?? publishedDate,
          author,
          publisher: author,
          isPartOf: {
            "@type": "Blog",
            name: cfg.pageTitle,
            url: siteUrl,
          },
          inLanguage: cfg.locale,
        }
      : {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: title,
          description,
          url: pageUrl,
          isPartOf: {
            "@type": "WebSite",
            name: cfg.pageTitle,
            url: siteUrl,
          },
          inLanguage: cfg.locale,
        }

    const coreStylesheet = css[0]?.content
    const coreScript = js.find(
      (r) => r.loadTime === "beforeDOMReady" && r.contentType === "external",
    )

    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="theme-color" content={initialBackgroundColor} />
        <style>{`html,body,#quartz-root{background-color:${initialBackgroundColor};}`}</style>
        {coreStylesheet && <link rel="preload" href={coreStylesheet} as="style" />}
        {coreScript && coreScript.contentType === "external" && (
          <link rel="preload" href={coreScript.src} as="script" />
        )}
        {cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />
            {cfg.theme.typography.title && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )}
          </>
        )}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <meta name="og:site_name" content={cfg.pageTitle}></meta>
        <meta property="og:title" content={title} />
        <meta property="og:type" content={ogType} />
        <meta property="og:locale" content={cfg.locale.replace("-", "_")} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta property="og:description" content={description} />
        <meta property="og:image:alt" content={description} />
        {publishedDate && <meta property="article:published_time" content={publishedDate} />}
        {modifiedDate && <meta property="article:modified_time" content={modifiedDate} />}
        {isRecordPage && <meta property="article:author" content={author.name} />}

        {!usesCustomOgImage && (
          <>
            <meta property="og:image" content={ogImageDefaultPath} />
            <meta property="og:image:url" content={ogImageDefaultPath} />
            <meta name="twitter:image" content={ogImageDefaultPath} />
            <meta
              property="og:image:type"
              content={`image/${getFileExtension(ogImageDefaultPath) ?? "png"}`}
            />
          </>
        )}

        {cfg.baseUrl && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl}></meta>
            <meta property="og:url" content={pageUrl}></meta>
            <meta property="twitter:url" content={pageUrl}></meta>
          </>
        )}

        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        <link rel="icon" href={iconPath} />
        <meta name="description" content={description} />
        <meta name="generator" content="Quartz" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
        />

        {css.map((resource) => CSSResourceToStyleElement(resource, true))}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData)
          } else {
            return resource
          }
        })}
      </head>
    )
  }

  return Head
}) satisfies QuartzComponentConstructor
