import { ThumbsUp, ThumbsDown } from 'lucide-react'

import { Button } from '@/components/ui/button.jsx'
import { cn } from '@/lib/utils'

import { useFeedbackVote } from '../useFeedbackVote.js'

/*
 * Written out in full rather than built from the vote value, because Tailwind reads these
 * files as text: a class name assembled at runtime is a class name that never gets generated.
 * The hover colours repeat the active ones on purpose — without them the ghost button's own
 * hover would wash the colour out, and a recorded vote would look undone by the pointer
 * passing over it.
 */
const ACTIVE_UP_CLASSES =
  'bg-market-up/10 text-market-up hover:bg-market-up/15 hover:text-market-up'
const ACTIVE_DOWN_CLASSES =
  'bg-market-down/10 text-market-down hover:bg-market-down/15 hover:text-market-down'

/**
 * The thumbs on a section. Every vote is stored against the exact content that was on screen,
 * which is what makes the feedback worth keeping.
 *
 * @param {object} props
 * @param {string} props.sectionType
 * @param {string} [props.contentId] - What the section is currently showing.
 * @param {string} props.sectionLabel - Names the section in the buttons' accessible labels,
 *   so four identical pairs of thumbs do not all announce themselves as "useful".
 *
 * Each thumb is a toggle: pressing the pressed one withdraws the vote. The labels stay fixed and
 * `aria-pressed` carries the state, which is what a screen reader expects from a toggle — a label
 * that flipped to "remove" would announce the action twice and the state not at all.
 */
export const FeedbackVoteButtons = ({ sectionType, contentId, sectionLabel }) => {
  const { currentVote, toggleVote, hasFailed } = useFeedbackVote({ sectionType, contentId })

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <VoteButton
          Icon={ThumbsUp}
          label={`${sectionLabel}: useful`}
          isActive={currentVote === 'up'}
          activeClassName={ACTIVE_UP_CLASSES}
          onClick={() => toggleVote('up')}
        />
        <VoteButton
          Icon={ThumbsDown}
          label={`${sectionLabel}: not useful`}
          isActive={currentVote === 'down'}
          activeClassName={ACTIVE_DOWN_CLASSES}
          onClick={() => toggleVote('down')}
        />
      </div>

      {hasFailed ? (
        <p role="alert" className="text-xs text-muted-foreground">
          Not saved. Try again.
        </p>
      ) : null}
    </div>
  )
}

const VoteButton = ({ Icon, label, isActive, activeClassName, onClick }) => (
  <Button
    variant="ghost"
    size="icon-sm"
    aria-label={label}
    aria-pressed={isActive}
    onClick={onClick}
    className={cn('text-muted-foreground hover:text-foreground', isActive && activeClassName)}
  >
    <Icon className="size-4" aria-hidden="true" />
  </Button>
)
