import { z } from 'zod'

const MINIMUM_JWT_SECRET_LENGTH = 32

const canBeParsedAsUrl = (value) => URL.canParse(value)

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  // The most fragile value in this file, and the only one whose mistakes surface exclusively
  // in production. It is compared against the browser's `Origin` header character for
  // character, and that header is only ever scheme, host and port — so a trailing slash, a
  // stray path or a copied-in space all match nothing, and every signed-in request comes
  // back 401 with no clue as to why.
  //
  // Rather than trusting anyone to paste it perfectly, anything that parses is reduced to
  // its origin. What cannot be repaired is a missing scheme, because `https` and `http` are
  // a real choice — so that one is rejected, by name, with the fix in the message.
  CLIENT_ORIGIN: z
    .string()
    .trim()
    .default('http://localhost:5173')
    .refine(canBeParsedAsUrl, {
      message:
        'must include the scheme — https://your-app.vercel.app, not your-app.vercel.app ' +
        '(hosting dashboards show the domain without it)',
    })
    .transform((value) => new URL(value).origin),

  MONGODB_URI: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(MINIMUM_JWT_SECRET_LENGTH).optional(),

  COINGECKO_API_KEY: z.string().min(1).optional(),

  HUGGINGFACE_API_KEY: z.string().min(1).optional(),

  ANTHROPIC_API_KEY: z.string().min(1).optional(),
})

const exitWithConfigurationProblems = (problems) => {
  console.error(`Cannot start: the environment is not configured correctly.\n${problems}`)
  console.error('See server/.env.example for the expected variables.')
  process.exit(1)
}

const parseEnvironment = () => {
  const parseResult = environmentSchema.safeParse(process.env)

  if (!parseResult.success) {
    exitWithConfigurationProblems(
      parseResult.error.issues
        .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('\n')
    )
  }

  const parsedEnvironment = parseResult.data
  const missingInProduction = []

  if (parsedEnvironment.NODE_ENV === 'production') {
    if (!parsedEnvironment.MONGODB_URI) {
      missingInProduction.push('  MONGODB_URI: required in production')
    }
    if (!parsedEnvironment.JWT_SECRET) {
      missingInProduction.push(
        `  JWT_SECRET: required in production, at least ${MINIMUM_JWT_SECRET_LENGTH} characters`
      )
    }
    if (missingInProduction.length > 0) {
      exitWithConfigurationProblems(missingInProduction.join('\n'))
    }
  }

  return parsedEnvironment
}

export const env = parseEnvironment()

export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'
