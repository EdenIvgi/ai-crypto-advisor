import Anthropic from '@anthropic-ai/sdk'

import { env } from '../config/env.js'

// The cheapest model in the family, and the one that fits: these questions are explanatory
// rather than hard, and the answer is three sentences long. It is also old enough to predate the
// effort parameter, which is why there is none below — sending one to this model is a 400.
const MODEL_ID = 'claude-haiku-4-5'

const MAX_ANSWER_TOKENS = 1000

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
    system: systemPrompt,
    messages: [{ role: 'user', content: question }],
  })

  if (message.stop_reason === 'refusal') throw new Error('the model declined to answer')
  if (message.stop_reason === 'max_tokens') throw new Error('ran out of tokens mid-answer')

  const answer = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim()

  if (answer.length === 0) throw new Error('answered with no text')

  return answer
}
