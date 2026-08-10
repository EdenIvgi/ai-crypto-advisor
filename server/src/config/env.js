import { z } from 'zod'

/**
 * The only module in the server that reads `process.env`. Everything else imports `env`
 * from here, so a missing variable fails loudly at boot instead of surfacing as an
 * undefined halfway through a request.
 */
const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.url().default('http://localhost:5173'),
})

const parseEnvironment = () => {
  const parseResult = environmentSchema.safeParse(process.env)

  if (!parseResult.success) {
    const problems = parseResult.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')

    console.error(`Cannot start: the environment is not configured correctly.\n${problems}`)
    console.error('See server/.env.example for the expected variables.')
    process.exit(1)
  }

  return parseResult.data
}

export const env = parseEnvironment()

export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'
