import { cn } from '@/lib/utils'

import { useCoinPrices } from '../useDashboard.js'
import { formatPriceUsd, formatChangePercent } from '../dashboardFormatters.js'
import { DashboardSectionCard } from '../components/DashboardSectionCard.jsx'
import { FeedbackVoteButtons } from '../components/FeedbackVoteButtons.jsx'

const SKELETON_ROW_COUNT = 3
const SECTION_TITLE = 'Coin prices'

export const CoinPricesSection = ({ className }) => {
  const prices = useCoinPrices()

  return (
    <DashboardSectionCard
      className={className}
      title={SECTION_TITLE}
      /*
       * "Saved" rather than "sample": a fallback here is either the last CoinGecko response
       * that worked or the bundled sample, and the only distinction a reader needs is the
       * one this makes — these numbers are what the market is quoting, or they are not.
       */
      sourceLabel={
        prices.data && (prices.data.isFallback ? 'Saved prices' : 'CoinGecko · live')
      }
      isPending={prices.isPending}
      error={prices.error}
      onRetry={prices.refetch}
      skeleton={<CoinPricesSkeleton />}
      actions={
        prices.data ? (
          <FeedbackVoteButtons
            sectionType="coin_prices"
            contentId={prices.data.contentId}
            sectionLabel={SECTION_TITLE}
          />
        ) : null
      }
    >
      {prices.data?.coins.length ? (
        <ul className="grid gap-x-10 sm:grid-cols-2 xl:grid-cols-3">
          {prices.data.coins.map((coin) => (
            <CoinPriceRow key={coin.id} coin={coin} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          None of the assets you follow could be priced right now.
        </p>
      )}
    </DashboardSectionCard>
  )
}

/**
 * Exactly zero is not a gain, and it is also what the API reports when it has no 24-hour
 * figure for an asset. Colouring it green would turn both of those into good news.
 */
const getMovementClassName = (changePercent) => {
  if (changePercent > 0) return 'text-market-up'
  if (changePercent < 0) return 'text-market-down'
  return 'text-muted-foreground'
}

const CoinPriceRow = ({ coin }) => (
  <li className="flex items-baseline justify-between gap-4 border-t border-rule py-3.5">
    <div className="min-w-0">
      <span className="font-mono text-sm font-semibold">{coin.symbol}</span>
      <span className="ml-2 truncate text-sm text-muted-foreground">{coin.name}</span>
    </div>

    <div className="text-right">
      <p className="font-mono text-sm font-medium" data-numeric>
        {formatPriceUsd(coin.priceUsd)}
      </p>
      <p
        className={cn('font-mono text-xs', getMovementClassName(coin.change24hPercent))}
        data-numeric
      >
        {formatChangePercent(coin.change24hPercent)}
        <span className="sr-only"> over the last 24 hours</span>
      </p>
    </div>
  </li>
)

const CoinPricesSkeleton = () => (
  <ul className="grid gap-x-10 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
      <li
        key={index}
        className="flex items-center justify-between gap-4 border-t border-rule py-3.5"
      >
        <div className="skeleton h-4 w-28" />
        <div className="skeleton h-9 w-20" />
      </li>
    ))}
  </ul>
)
