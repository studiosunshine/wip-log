import { PageFrame, PageFrameProps } from "./types"
import { FullSlug, resolveRelative } from "../../util/path"
import HeaderConstructor from "../Header"
import LatestRecordRedirectConstructor from "../LatestRecordRedirect"
import LatestRecordBackLinkConstructor from "../LatestRecordBackLink"
import RecordMonthIndexConstructor from "../RecordMonthIndex"
import RecordMonthPagerConstructor from "../RecordMonthPager"
import RecordCalendarConstructor from "../RecordCalendar"
import RecordPagerConstructor from "../RecordPager"

const Header = HeaderConstructor()
const LatestRecordRedirect = LatestRecordRedirectConstructor({})
const LatestRecordBackLink = LatestRecordBackLinkConstructor({})
const RecordCalendar = RecordCalendarConstructor()
const RecordMonthIndex = RecordMonthIndexConstructor()
const RecordMonthPager = RecordMonthPagerConstructor()
const RecordPager = RecordPagerConstructor({})

/**
 * Full-width page frame — no sidebars. The center content area spans the
 * full width of the page. Header, beforeBody, body, afterBody, and footer
 * are all rendered in a single column.
 *
 * Useful for page types like Canvas, presentations, or dashboards that
 * need maximum horizontal space.
 */
export const FullWidthFrame: PageFrame = {
  name: "full-width",
  render({
    componentData,
    header,
    beforeBody,
    pageBody: Content,
    afterBody,
    footer: Footer,
  }: PageFrameProps) {
    const isIndex = componentData.fileData.slug === "index"
    const isAbout = componentData.fileData.slug === "studio-sunshine"
    const currentSlug = componentData.fileData.slug
    const aboutBaseHref = currentSlug ? resolveRelative(currentSlug, "studio-sunshine" as FullSlug) : "./studio-sunshine"
    const aboutHref =
      currentSlug && !isIndex && !isAbout
        ? `${aboutBaseHref}?from=${encodeURIComponent(resolveRelative("studio-sunshine" as FullSlug, currentSlug))}`
        : aboutBaseHref

    return (
      <>
        <div class="center full-width">
          <div class="page-header">
            <Header {...componentData}>
              {header.map((HeaderComponent) => (
                <HeaderComponent {...componentData} />
              ))}
            </Header>
            <div class="popover-hint">
              {beforeBody.map((BodyComponent) => (
                <BodyComponent {...componentData} />
              ))}
            </div>
            {!isIndex && (
              <>
                <RecordPager {...componentData} />
                <RecordMonthPager {...componentData} />
              </>
            )}
          </div>
          {isIndex ? (
            <LatestRecordRedirect {...componentData} />
          ) : (
            <>
              <Content {...componentData} />
              <RecordMonthIndex {...componentData} />
              <LatestRecordBackLink {...componentData} />
              <hr />
              <div class="page-footer">
                <RecordCalendar {...componentData} />
                {afterBody.map((BodyComponent) => (
                  <BodyComponent {...componentData} />
                ))}
              </div>
              <p class="record-copyright">
                ⓒ 2026 <a href={aboutHref} data-record-about-link>studio sunshine</a>. All rights reserved.
              </p>
            </>
          )}
        </div>
        {Footer && <Footer {...componentData} />}
      </>
    )
  },
}
