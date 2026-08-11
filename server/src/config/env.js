import { z } from 'zod'

/**
 * The only module in the server that reads `process.env`. Everything else imports `env`
 * from here, so a missing variable fails loudly at boot instead of surfacing as an
 * undefined halfway through a request.
 */
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

  // Optional in the schema so development and tests can run without any setup; production
  // requires both, enforced below where the failure message can say why.
  MONGODB_URI: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(MINIMUM_JWT_SECRET_LENGTH).optional(),

  // Optional everywhere, including production. CoinGecko's public tier needs no key at all;
  // a free one just raises the allowance, which matters because that allowance is counted
  // per IP address and a cloud host shares its address with strangers. Anyone cloning this
  // repository has to be able to run it without signing up for anything.
  COINGECKO_API_KEY: z.string().min(1).optional(),

  // Also optional, but it buys more than the CoinGecko one does: CryptoPanic has no
  // anonymous tier at all, so without this the news section serves sample headlines and
  // says so. Optional anyway, because a clone of this repository has to run without anyone
  // signing up for anything — a section that degrades honestly is better than a boot failure.
  CRYPTOPANIC_API_KEY: z.string().min(1).optional(),
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
