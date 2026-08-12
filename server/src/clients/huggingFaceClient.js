import { z } from 'zod'

import { env } from '../config/env.js'

const HUGGING_FACE_CHAT_URL = 'https://router.huggingface.co/v1/chat/completions'
const REQUEST_TIMEOUT_MS = 20000

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

const SAMPLING_TEMPERATURE = 0.25

export const isHuggingFaceConfigured = Boolean(env.HUGGINGFACE_API_KEY)

const chatCompletionSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({ content: z.string() }),
        finish_reason: z.string().nullable().optional(),
      })
    )
    .min(1, 'the model returned no choices'),
})

export const generateChatCompletion = async (messages) => {
  if (!isHuggingFaceConfigured) throw new Error('HUGGINGFACE_API_KEY is not configured')

  const failures = []

  for (const model of MODELS_IN_PREFERENCE_ORDER) {
    try {
      return await requestOneModel(model, messages)
    } catch (modelError) {
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
