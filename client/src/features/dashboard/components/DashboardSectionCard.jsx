import { Button } from '@/components/ui/button.jsx'
import { Card } from '@/components/ui/card.jsx'
import { cn } from '@/lib/utils'

/**
 * The shell every dashboard section wears: the provenance eyebrow, the heading, a slot for
 * the vote buttons M6 adds, and the loading and error states. Sections supply only their
 * content, which is what keeps four independently-sourced cards looking like one product.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.sourceLabel] - Where this section's data came from. Left undefined
 *   while the query is in flight: a placeholder is honest, a guessed source name is not.
 * @param {boolean} props.isPending
 * @param {Error | null} props.error
 * @param {() => void} props.onRetry
 * @param {import('react').ReactNode} [props.skeleton] - Shaped like the real content, so
 *   nothing moves when the data lands.
 * @param {import('react').ReactNode} [props.actions] - Reserved for the M6 vote buttons.
 * @param {import('react').ReactNode} props.children
 * @param {string} [props.className]
 */
export const DashboardSectionCard = ({
  title,
  sourceLabel,
  isPending,
  error,
  onRetry,
  skeleton,
  actions,
  children,
  className,
}) => (
  <Card className={cn('gap-0 px-5 py-0 sm:px-6', className)}>
    <div className="flex items-start justify-between gap-4 py-5 sm:py-6">
      <div className="min-w-0">
        <p className="eyebrow">
          {sourceLabel ?? (
            <span className="h-2 w-24 animate-pulse rounded-full bg-muted" aria-hidden="true" />
          )}
        </p>
        <h2 className="mt-2.5 font-semibold tracking-tight">{title}</h2>
      </div>
      {actions}
    </div>

    {/* Grows to fill the card so that a section sharing a row with a taller one can lay its
        own content out against the full height rather than leaving a gap under it. */}
    <div className="flex-1 pb-5 sm:pb-6">
      {isPending ? <SectionPlaceholder title={title}>{skeleton}</SectionPlaceholder> : null}
      {error ? <SectionError error={error} onRetry={onRetry} /> : null}
      {!isPending && !error ? children : null}
    </div>
  </Card>
)

const SectionPlaceholder = ({ title, children }) => (
  <div role="status" aria-live="polite">
    <span className="sr-only">Loading {title.toLowerCase()}</span>
    {children}
  </div>
)

/**
 * Worded as a state of the section rather than an apology, and always paired with the one
 * action that can change it. A failing source degrades this card and nothing else.
 */
const SectionError = ({ error, onRetry }) => (
  <div role="alert" className="flex flex-wrap items-center gap-x-4 gap-y-3">
    <p className="text-sm text-muted-foreground">{error.message}</p>
    <Button variant="outline" size="sm" onClick={onRetry}>
      Try again
    </Button>
  </div>
)
