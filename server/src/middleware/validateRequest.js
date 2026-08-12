import { BadRequestError } from '../lib/httpErrors.js'

export const validateRequest = (schemas) => (request, _response, next) => {
  for (const [part, schema] of Object.entries(schemas)) {
    const parseResult = schema.safeParse(request[part])

    if (!parseResult.success) {
      return next(
        new BadRequestError(
          `The ${part} of that request was not valid`,
          toFieldErrors(parseResult.error)
        )
      )
    }

    replaceRequestPart(request, part, parseResult.data)
  }

  next()
}

const replaceRequestPart = (request, part, parsedValue) => {
  Object.defineProperty(request, part, {
    value: parsedValue,
    writable: true,
    enumerable: true,
    configurable: true,
  })
}

const toFieldErrors = (zodError) =>
  Object.fromEntries(
    zodError.issues.map((issue) => [issue.path.join('.') || '_', issue.message])
  )
