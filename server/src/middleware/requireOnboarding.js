import { ConflictError } from '../lib/httpErrors.js'

/**
 * Blocks routes that are meaningless without quiz answers. Runs after `loadCurrentUser`,
 * whose document it reads.
 *
 * The absence of `preferences` is the only record that someone has not been through the
 * quiz — there is no separate flag that could disagree with the answers themselves.
 *
 * @type {import('express').RequestHandler}
 */
export const requireOnboarding = (request, _response, next) => {
  if (request.currentUser?.preferences) return next()

  next(
    new ConflictError(
      'Answer the three onboarding questions first — the dashboard is built from them',
      'ONBOARDING_REQUIRED'
    )
  )
}
