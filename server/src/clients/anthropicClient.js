import Anthropic from '@anthropic-ai/sdk'

import { env } from '../config/env.js'

const MODEL_ID = 'claude-opus-5'

// Thinking is on by default on this model and is spent from the same allowance as the answer,
// so this is not a three-sentence budget — it is three sentences plus the reasoning behind them.
const MAX_ANSWER_TOKENS = 2000

// A retried attempt costs the reader the whole wait again, so these two multiply: this is a
// thirty-second ceiling in front of somebody who is watching a spinner, not a fifteen-second one.
const REQUEST_TIMEOUT_MS = 15000
const MAX_RETRIES = 1

export const isAnthropicConfigured = Boolean(env.ANTHROPIC_API_KEY)

// Built once, and only when there is a key: the constructor looks for one and throws without it,
// which would take the whole server down at import time rather than disabling one card.
const anthropic = isAnthropicConfigured
  ? new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
      timeout: REQUEST_TIMEOUT_MS,
      maxRetries: MAX_RETRIES,
    })
  : null

export const generateAnswer = async ({ systemPrompt, question }) => {
  if (!anthropic) throw new Error('ANTHROPIC_API_KEY is not configured')

  const message = await anthropic.messages.create({
    model: MODEL_ID,
    max_tokens: MAX_ANSWER_TOKENS,
    // The reader is waiting at an input, and the questions here are explanatory rather than
    // hard. Low keeps the reasoning short enough to answer at the speed of a search box.
    output_config: { effort: 'low' },
    system: systemPrompt,
    messages: [{ role: 'user', content: question }],
  })

  if (message.stop_reason === 'refusal') throw new Error('the model declined to answer')
  if (message.stop_reason === 'max_tokens') throw new Error('ran out of tokens mid-answer')

  // Thinking arrives as its own blocks in the same array, and their text is empty unless it is
  // asked for — so the answer is the text blocks, not the first block.
  const answer = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim()

  if (answer.length === 0) throw new Error('answered with no text')

  return answer
}
