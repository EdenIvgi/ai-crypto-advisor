const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

/**
 * An API call that failed. Carries the server's machine-readable code so callers can
 * branch on the reason (`ONBOARDING_REQUIRED`, `UNAUTHORIZED`) instead of matching prose.
 */
export class ApiRequestError extends Error {
  constructor(message, { statusCode, code, fieldErrors } = {}) {
    super(message)
    this.name = 'ApiRequestError'
    this.statusCode = statusCode
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

const readErrorFromResponse = async (response) => {
  try {
    const body = await response.json()
    return new ApiRequestError(body?.error?.message ?? 'Request failed', {
      statusCode: response.status,
      code: body?.error?.code,
      fieldErrors: body?.error?.fieldErrors,
    })
  } catch {
    return new ApiRequestError(`Request failed with status ${response.status}`, {
      statusCode: response.status,
    })
  }
}

/**
 * The only place in the client that calls `fetch`. Feature modules wrap this; components
 * never call it directly.
 *
 * `credentials: 'include'` is what carries the auth cookie to the API on a different
 * origin — without it every authenticated request silently comes back 401 in production.
 *
 * @param {string} path - Path below the API root, e.g. `/api/auth/me`.
 * @param {{ method?: string, body?: unknown, signal?: AbortSignal }} [options]
 * @returns {Promise<unknown>} The parsed JSON body, or null for an empty response.
 */
export const requestApi = async (path, { method = 'GET', body, signal } = {}) => {
  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (networkError) {
    if (networkError.name === 'AbortError') throw networkError
    throw new ApiRequestError(
      'Could not reach the server. It may be waking up — try again in a moment.',
      { code: 'NETWORK_ERROR' }
    )
  }

  if (!response.ok) throw await readErrorFromResponse(response)

  if (response.status === 204) return null
  return response.json()
}
