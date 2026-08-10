import { BadRequestError } from '../lib/httpErrors.js'

/**
 * Turns Zod schemas into middleware, so controllers can assume their input is already
 * valid and contain no validation of their own.
 *
 * The parsed result replaces the original, which means defaults and coercions declared in
 * the schema actually reach the controller.
 *
 * @param {{ body?: import('zod').ZodType, query?: import('zod').ZodType, params?: import('zod').ZodType }} schemas
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.post('/login', validateRequest({ body: loginBodySchema }), logIn)
 */
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

    request[part] = parseResult.data
  }

  next()
}

/**
 * Flattens Zod issues into `{ fieldName: message }`, which is what the client's form
 * components render next to each input.
 */
const toFieldErrors = (zodError) =>
  Object.fromEntries(
    zodError.issues.map((issue) => [issue.path.join('.') || '_', issue.message])
  )
