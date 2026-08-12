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

export const requestApi = async (path, { method = 'GET', body, signal } = {}) => {
  let response

  try {
    // Relative on purpose, and deliberately not configurable. An absolute origin here would put
    // the API on a different site from the page, which makes the session cookie a third-party
    // cookie — and Safari discards those by default, as does any browser in a private window.
    // Both environments route /api to the API instead: Vercel by rewrite, Vite by dev proxy.
    response = await fetch(path, {
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
