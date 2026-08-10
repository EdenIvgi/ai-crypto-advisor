import { useCurrentUser } from '@/features/auth/useAuth.js'

import { formatBriefingDate } from './dashboardFormatters.js'
import { CoinPricesSection } from './sections/CoinPricesSection.jsx'
import { AiInsightSection } from './sections/AiInsightSection.jsx'
import { CryptoMemeSection } from './sections/CryptoMemeSection.jsx'
import { MarketNewsSection } from './sections/MarketNewsSection.jsx'

/**
 * The reading order of the dashboard, and the only place it is decided. Not the order the
 * user happened to tick the boxes in during onboarding — that is click order, which carries
 * no meaning and would give two people with identical answers different layouts.
 *
 * The widths are flex bases rather than grid columns so the row arranges itself around
 * whatever the user chose: with both the insight and the meme selected they share a row in
 * proportion, and with only one of them selected it grows to the full width instead of
 * leaving a hole where the other card would have been.
 */
const SECTIONS_IN_READING_ORDER = [
  { preference: 'coin_prices', Section: CoinPricesSection, widthClassName: 'basis-full' },
  {
    preference: 'ai_insight',
    Section: AiInsightSection,
    widthClassName: 'min-w-0 grow basis-full lg:basis-96',
  },
  {
    preference: 'fun_meme',
    Section: CryptoMemeSection,
    widthClassName: 'min-w-0 grow basis-full lg:basis-80',
  },
  { preference: 'market_news', Section: MarketNewsSection, widthClassName: 'basis-full' },
]

export const DashboardPage = () => {
  const { user } = useCurrentUser()

  const firstName = user?.name?.split(' ')[0]
  const selectedSections = user?.preferences?.contentSections ?? []
  const visibleSections = SECTIONS_IN_READING_ORDER.filter((section) =>
    selectedSections.includes(section.preference)
  )

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
      <header>
        <p className="eyebrow">{formatBriefingDate()}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {firstName ? `Your briefing, ${firstName}` : 'Your briefing'}
        </h1>
        <p className="mt-3 max-w-md text-muted-foreground text-pretty">
          Built from the answers you gave. Every section below is one you asked for.
        </p>
      </header>

      <div className="mt-10 flex flex-wrap gap-5 sm:mt-12 sm:gap-6">
        {visibleSections.map(({ preference, Section, widthClassName }) => (
          <Section key={preference} className={widthClassName} />
        ))}
      </div>
    </main>
  )
}
