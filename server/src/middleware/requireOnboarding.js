import { ConflictError } from '../lib/httpErrors.js'

export const requireOnboarding = (request, _response, next) => {
  if (request.currentUser?.preferences) return next()

  next(
    new ConflictError(
      'Answer the three onboarding questions first — the dashboard is built from them',
      'ONBOARDING_REQUIRED'
    )
  )
}
