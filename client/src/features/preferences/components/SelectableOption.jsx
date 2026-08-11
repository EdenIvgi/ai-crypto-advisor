import { useId } from 'react'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils.js'

/**
 * One answer in the quiz. A real `<button>` rather than a styled `div`, so it is reachable
 * by Tab and activated by Enter or Space without any key handling of our own.
 *
 * Single-choice questions get radio semantics and multiple-choice questions get
 * `aria-pressed`, so a screen reader announces "one of these" or "any of these" correctly
 * instead of both reading as generic buttons.
 *
 * The title is the name and the subtitle is the description, wired explicitly rather than left
 * to name-from-content. Left to itself, the option's name became the title and the whole
 * explanation run together — "Day TraderYou are in and out, and the charts matter today" — which
 * is the name of nothing. Now the name is the answer and the sentence explaining it arrives as
 * the description, which is the order somebody choosing needs them in.
 */
export const SelectableOption = ({
  isSelected,
  isSingleChoice = false,
  isDisabled = false,
  onToggle,
  title,
  subtitle,
  className,
}) => {
  const optionId = useId()
  const titleId = `${optionId}-title`
  const subtitleId = `${optionId}-subtitle`

  return (
    <button
      type="button"
      role={isSingleChoice ? 'radio' : undefined}
      aria-checked={isSingleChoice ? isSelected : undefined}
      aria-pressed={isSingleChoice ? undefined : isSelected}
      aria-labelledby={titleId}
      aria-describedby={subtitle ? subtitleId : undefined}
      disabled={isDisabled}
      onClick={onToggle}
      className={cn(
        'group relative flex w-full items-start gap-3 rounded-lg border p-4 text-left transition',
        // The offset takes the page's own colour rather than Tailwind's default white, which on
        // the dark theme was a bright halo in a colour the palette does not contain.
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-foreground/25 hover:bg-accent/40',
        isDisabled && 'cursor-not-allowed opacity-40 hover:border-border hover:bg-transparent',
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border',
          isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
        )}
      >
        {isSelected ? <Check className="size-3.5" strokeWidth={3} /> : null}
      </span>

      <span className="min-w-0">
        <span id={titleId} className="block font-medium">
          {title}
        </span>
        {subtitle ? (
          <span id={subtitleId} className="mt-0.5 block text-sm text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </span>
    </button>
  )
}
