import { ArrowUpRight } from 'lucide-react'

import { useMarketNews } from '../useDashboard.js'
import { formatTimeSince } from '../dashboardFormatters.js'
import { DashboardSectionCard } from '../components/DashboardSectionCard.jsx'
import { FeedbackVoteButtons } from '../components/FeedbackVoteButtons.jsx'

const SKELETON_ROW_COUNT = 4
const SECTION_TITLE = 'Market news'

export const MarketNewsSection = ({ className }) => {
  const news = useMarketNews()

  return (
    <DashboardSectionCard
      className={className}
      title={SECTION_TITLE}
      // Not a publisher's name, unlike the other three sections: this one merges four feeds,
      // and every headline already carries the name of the publication it came from.
      sourceLabel={news.data && (news.data.isFallback ? 'Sample headlines' : 'Live headlines')}
      isPending={news.isPending}
      error={news.error}
      onRetry={news.refetch}
      skeleton={<MarketNewsSkeleton />}
      actions={
        news.data ? (
          <FeedbackVoteButtons
            sectionType="market_news"
            contentId={news.data.contentId}
            sectionLabel={SECTION_TITLE}
          />
        ) : null
      }
    >
      {news.data?.articles.length ? (
        // Multi-column rather than a grid: a grid would lay five headlines out across the
        // rows, so the second-newest would sit to the right of the newest instead of below
        // it. Columns fill downwards, which is the order the list is sorted in.
        <ol className="lg:columns-2 lg:gap-x-10">
          {news.data.articles.map((article) => (
            <NewsHeadline key={article.id} article={article} />
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nothing has been published about the assets you follow today.
        </p>
      )}
    </DashboardSectionCard>
  )
}

const NewsHeadline = ({ article }) => (
  <li className="break-inside-avoid border-t border-rule">
    <a
      href={article.url}
      target="_blank"
      rel="noreferrer"
      className="group block py-3.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      <p className="flex items-start gap-1.5 text-sm leading-snug font-medium text-pretty">
        <span className="group-hover:underline group-hover:decoration-primary/40 group-hover:underline-offset-4">
          {article.title}
        </span>
        <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
      </p>
      <p className="data-label mt-1.5">
        {article.source} · {formatTimeSince(article.publishedAt)}
      </p>
    </a>
  </li>
)

const MarketNewsSkeleton = () => (
  <ul className="lg:columns-2 lg:gap-x-10">
    {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
      <li key={index} className="break-inside-avoid border-t border-rule py-3.5">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton mt-2.5 h-3 w-24" />
      </li>
    ))}
  </ul>
)
