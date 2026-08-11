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

    replaceRequestPart(request, part, parseResult.data)
  }

  next()
}

/**
 * Writes the parsed value over the original.
 *
 * `defineProperty` rather than plain assignment, because Express 5 exposes `req.query` through a
 * prototype getter with **no setter**: `request.query = parsed` throws `Cannot set property query
 * of #<IncomingMessage> which has only a getter`, and every module here is an ES module, so that
 * failure is a thrown TypeError rather than a silent no-op. `body` and `params` are ordinary
 * properties and were always fine — which is why the `query` support this function has always
 * advertised stayed broken until the first route needed it.
 */
const replaceRequestPart = (request, part, parsedValue) => {
  Object.defineProperty(request, part, {
    value: parsedValue,
    writable: true,
    enumerable: true,
    configurable: true,
  })
}

/**
 * Flattens Zod issues into `{ fieldName: message }`, which is what the client's form
 * components render next to each input.
 */
const toFieldErrors = (zodError) =>
  Object.fromEntries(
    zodError.issues.map((issue) => [issue.path.join('.') || '_', issue.message])
  )
