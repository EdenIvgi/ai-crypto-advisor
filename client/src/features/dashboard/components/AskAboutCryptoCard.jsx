import { useState } from 'react'
import { ArrowUp, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button.jsx'
import { Card } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { cn } from '@/lib/utils'
import { useAskAboutCrypto } from '../useDashboard.js'

const MINIMUM_QUESTION_LENGTH = 3

const EXAMPLE_QUESTIONS = [
  'What is staking?',
  'What does Solana do differently?',
  'What is a Bitcoin halving?',
]

export const AskAboutCryptoCard = ({ className }) => {
  const [question, setQuestion] = useState('')
  const ask = useAskAboutCrypto()

  const isTooShort = question.trim().length < MINIMUM_QUESTION_LENGTH

  const handleSubmit = (event) => {
    event.preventDefault()
    if (isTooShort || ask.isPending) return
    ask.mutate(question.trim())
  }

  const handleExampleClicked = (example) => {
    setQuestion(example)
    ask.mutate(example)
  }

  return (
    <Card className={cn('gap-4 px-5 py-5 sm:px-6 sm:py-6', className)}>
      <div>
        <p className="eyebrow flex items-center gap-1.5">
          <Sparkles aria-hidden="true" className="size-3" />
          Answered by Claude
        </p>
        <h2 className="mt-2.5 font-semibold tracking-tight">Ask about a coin</h2>
        {/* Said once, up front, rather than under every answer: the two things this box will
            not do are the two things a reader is most likely to try it with. */}
        <p className="mt-1.5 text-sm text-pretty text-muted-foreground">
          What a coin is and how its network works. Not prices, and not investment advice.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Label htmlFor="crypto-question" className="sr-only">
          Your question about a coin
        </Label>
        <Input
          id="crypto-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="What is staking?"
          disabled={ask.isPending}
          autoComplete="off"
        />
        <Button
          type="submit"
          size="icon"
          disabled={isTooShort || ask.isPending}
          aria-label="Ask the question"
        >
          <ArrowUp className="size-4" />
        </Button>
      </form>

      {ask.isIdle ? (
        <ul className="flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map((example) => (
            <li key={example}>
              <Button variant="outline" size="xs" onClick={() => handleExampleClicked(example)}>
                {example}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="empty:hidden" role="status" aria-live="polite">
        {ask.isPending ? <AnswerSkeleton /> : null}

        {ask.isError ? (
          <p className="text-sm text-destructive">{toReadableError(ask.error)}</p>
        ) : null}

        {ask.data ? (
          <p className="max-w-prose border-l-2 border-primary/50 pl-5 text-sm leading-relaxed text-pretty">
            {ask.data.answer}
          </p>
        ) : null}
      </div>
    </Card>
  )
}

// A question that outruns the client's deadline arrives as a bare AbortError, whose message is
// written for a developer reading a console rather than for somebody waiting on an answer.
const toReadableError = (error) =>
  error.name === 'TimeoutError' || error.name === 'AbortError'
    ? 'That took too long to come back. Try asking it again.'
    : error.message

const AnswerSkeleton = () => (
  <div className="space-y-2.5 border-l-2 border-border pl-5">
    <div className="skeleton h-4 w-full" />
    <div className="skeleton h-4 w-4/5" />
  </div>
)
