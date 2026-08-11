import { z } from 'zod'

import { env } from '../config/env.js'

const HUGGING_FACE_CHAT_URL = 'https://router.huggingface.co/v1/chat/completions'
const REQUEST_TIMEOUT_MS = 20000

/**
 * Tried in order, first success wins.
 *
 * Chosen for quality rather than price, which is only defensible because the prices were
 * checked: at roughly 700 tokens in and 220 out, one insight costs between $0.000014 and
 * $0.000052 on these three. With one call per person per day the monthly credit is not the
 * constraint, so there is no reason to reach for the cheapest model available.
 *
 * The provider is deliberately not pinned — `model:provider` is accepted, but leaving it off
 * lets Hugging Face route to whichever provider is live, which is one fewer thing to break.
 *
 * Rejected, and worth saying why: the `Coder` variants of Qwen are cheaper and write prose
 * like a commit message, the `Thinking` variants emit their reasoning as part of the answer,
 * and two entries priced at zero are promotional listings rather than a free tier.
 */
const MODELS_IN_PREFERENCE_ORDER = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'meta-llama/Llama-3.1-8B-Instruct',
]

// Far more than four sentences need, and that is deliberate. Reasoning models on this router —
// `gpt-oss` among them — spend completion tokens thinking before they answer, and the thinking
// counts against this budget. At 320 the first version returned "ETH's 2.60% decline outpaces"
// and stopped: the model had not run out of things to say, it had run out of allowance.
const MAX_COMPLETION_TOKENS = 700

// Low, not zero. Zero on a paragraph of prose produces the same stock phrasings every day,
// which is the opposite of what a daily section is for; higher invents figures, and one model
// fabricated a transaction-fee statistic at 0.4.
const SAMPLING_TEMPERATURE = 0.25

/**
 * Whether a live call is possible at all. The service reads this and composes from prices
 * instead, rather than failing a request per reader to discover the same thing.
 */
export const isHuggingFaceConfigured = Boolean(env.HUGGINGFACE_API_KEY)

/**
 * Only the one field this application uses. `choices[0].message.content` is the OpenAI-shaped
 * contract that Hugging Face's router implements, and parsing narrowly means a provider that
 * answers with something else fails here, at the boundary, rather than storing an empty
 * paragraph in the database.
 */
const chatCompletionSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({ content: z.string() }),
        // Read so that a reply cut off at the token limit can be rejected rather than shown.
        // Half a sentence is not a shorter insight, it is a broken one, and the next model in
        // the chain is a better answer than a paragraph that stops mid-word.
        finish_reason: z.string().nullable().optional(),
      })
    )
    .min(1, 'the model returned no choices'),
})

/**
 * Sends a chat conversation to the first model that answers, and returns its reply as text.
 *
 * @param {Array<{ role: 'system' | 'user', content: string }>} messages
 * @returns {Promise<string>} The reply, trimmed.
 * @throws When the key is missing, or when every model in the chain fails.
 */
export const generateChatCompletion = async (messages) => {
  if (!isHuggingFaceConfigured) throw new Error('HUGGINGFACE_API_KEY is not configured')

  const failures = []

  for (const model of MODELS_IN_PREFERENCE_ORDER) {
    try {
      return await requestOneModel(model, messages)
    } catch (modelError) {
      // Kept rather than logged one by one: a model being unavailable is routine, and the
      // only interesting case is all of them failing, which is what the caller is told about.
      failures.push(`${model}: ${modelError.message}`)
    }
  }

  throw new Error(`every model failed — ${failures.join('; ')}`)
}

const requestOneModel = async (model, messages) => {
  const response = await fetch(HUGGING_FACE_CHAT_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.HUGGINGFACE_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: MAX_COMPLETION_TOKENS,
      temperature: SAMPLING_TEMPERATURE,
    }),
    // Generous compared with the other clients, because this one waits on a model rather than
    // a database read — but still bounded, so a stalled provider cannot hold a dashboard
    // request open until the browser gives up on it.
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`answered ${response.status}`)
  }

  const [choice] = chatCompletionSchema.parse(await response.json()).choices
  const reply = choice.message.content.trim()

  if (reply.length === 0) throw new Error('answered with an empty message')
  if (choice.finish_reason === 'length') throw new Error('ran out of tokens mid-answer')

  return reply
}
