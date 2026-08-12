import { useCurrentUser } from '@/features/auth/useAuth.js'
import { useQuizOptions } from '@/features/preferences/usePreferences.js'

import { formatBriefingDate } from './dashboardFormatters.js'
import { AskAboutCryptoCard } from './components/AskAboutCryptoCard.jsx'
import { CoinPricesSection } from './sections/CoinPricesSection.jsx'
import { AiInsightSection } from './sections/AiInsightSection.jsx'
import { CryptoMemeSection } from './sections/CryptoMemeSection.jsx'
import { MarketNewsSection } from './sections/MarketNewsSection.jsx'

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
  const quizOptions = useQuizOptions()

  const firstName = user?.name?.split(' ')[0]
  const selectedSections = user?.preferences?.contentSections ?? []
  const visibleSections = SECTIONS_IN_READING_ORDER.filter((section) =>
    selectedSections.includes(section.preference)
  )

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
      {/* The box shares the row with the heading rather than taking a band of its own. The space
          beside a two-line title is dead otherwise, and this keeps the grid below untouched. */}
      <div className="flex flex-wrap items-start gap-5 sm:gap-6">
        <header className="min-w-0 grow basis-full lg:basis-96">
          <p className="eyebrow">{formatBriefingDate()}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {firstName ? `Your briefing, ${firstName}` : 'Your briefing'}
          </h1>
          <p className="mt-3 max-w-lg text-pretty text-muted-foreground">
            Built from the answers you gave. Every section below is one you asked for.
          </p>
        </header>

        {quizOptions.data?.isAssistantAvailable ? (
          <AskAboutCryptoCard className="min-w-0 grow basis-full lg:basis-96" />
        ) : null}
      </div>

      <div className="mt-10 flex flex-wrap gap-5 sm:mt-12 sm:gap-6">
        {visibleSections.map(({ preference, Section, widthClassName }) => (
          <Section key={preference} className={widthClassName} />
        ))}
      </div>
    </main>
  )
}
