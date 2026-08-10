import { useAiInsight } from '../useDashboard.js'
import { DashboardSectionCard } from '../components/DashboardSectionCard.jsx'
import { FeedbackVoteButtons } from '../components/FeedbackVoteButtons.jsx'

const SECTION_TITLE = 'Insight of the day'

export const AiInsightSection = ({ className }) => {
  const insight = useAiInsight()

  return (
    <DashboardSectionCard
      className={className}
      title={SECTION_TITLE}
      sourceLabel={
        insight.data && (insight.data.isFallback ? 'Sample insight' : 'Written for you today')
      }
      isPending={insight.isPending}
      error={insight.error}
      onRetry={insight.refetch}
      skeleton={<AiInsightSkeleton />}
      actions={
        insight.data ? (
          <FeedbackVoteButtons
            sectionType="ai_insight"
            contentId={insight.data.contentId}
            sectionLabel={SECTION_TITLE}
          />
        ) : null
      }
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
    <div className="skeleton h-4 w-full" />
    <div className="skeleton h-4 w-full" />
    <div className="skeleton h-4 w-11/12" />
    <div className="skeleton h-4 w-3/5" />
  </div>
)
