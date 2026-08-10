import { z } from 'zod'

/**
 * The only module in the server that reads `process.env`. Everything else imports `env`
 * from here, so a missing variable fails loudly at boot instead of surfacing as an
 * undefined halfway through a request.
 */
const MINIMUM_JWT_SECRET_LENGTH = 32

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  // A trailing slash here is the single easiest way to break authentication in production
  // and nowhere else: the browser's `Origin` header never has one, so `https://app.tld/`
  // would silently match nothing and every signed-in request would come back 401. There is
  // only one thing a trailing slash could mean, so it is removed rather than rejected.
  CLIENT_ORIGIN: z
    .url()
    .default('http://localhost:5173')
    .transform((origin) => origin.replace(/\/+$/, '')),

  // Optional in the schema so development and tests can run without any setup; production
  // requires both, enforced below where the failure message can say why.
  MONGODB_URI: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(MINIMUM_JWT_SECRET_LENGTH).optional(),
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
