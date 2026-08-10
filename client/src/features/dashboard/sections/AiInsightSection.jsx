import { useAiInsight } from '../useDashboard.js'
import { DashboardSectionCard } from '../components/DashboardSectionCard.jsx'

export const AiInsightSection = ({ className }) => {
  const insight = useAiInsight()

  return (
    <DashboardSectionCard
      className={className}
      title="Insight of the day"
      sourceLabel={
        insight.data && (insight.data.isFallback ? 'Sample insight' : 'Written for you today')
      }
      isPending={insight.isPending}
      error={insight.error}
      onRetry={insight.refetch}
      skeleton={<AiInsightSkeleton />}
    >
      {/*
        The one piece of generated prose on the page, so it is the one thing set as prose:
        a rule down the left in the accent colour, and a longer measure than the cards
        around it. Nothing else on the dashboard is allowed to look like this.
      */}
      <blockquote className="flex h-full items-center border-l-2 border-primary/50 pl-5">
        {/* Capped at a readable measure for the same reason the meme is: with the meme
            deselected this card takes the full row, and prose does not stay readable at
            eleven hundred pixels a line. */}
        <p className="max-w-prose text-[0.9375rem] leading-relaxed text-pretty">
          {insight.data?.insight.text}
        </p>
      </blockquote>
    </DashboardSectionCard>
  )
}

const AiInsightSkeleton = () => (
  <div className="space-y-2.5 border-l-2 border-border pl-5">
    <div className="h-4 w-full animate-pulse rounded bg-muted" />
    <div className="h-4 w-full animate-pulse rounded bg-muted" />
    <div className="h-4 w-11/12 animate-pulse rounded bg-muted" />
    <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
  </div>
)
