/**
 * A small time-to-live cache that keeps the last good value even after it expires.
 *
 * That second part is the point of it. The dashboard's sources are free public APIs that rate
 * limit by IP, and this application runs from a shared cloud address — so being turned away
 * is an ordinary Tuesday, not an emergency. When it happens, minute-old prices are a far
 * better answer than an error, and the caller is told the value is stale so the interface can
 * say so rather than pass it off as current.
 *
 * In memory, so it empties on restart and is not shared between instances. Both are fine at
 * this size: the worst case is one extra call to the source.
 *
 * @param {{ ttlMs: number }} options
 * @returns {{ getOrFetch: (key: string, fetchValue: () => Promise<unknown>) => Promise<{ value: unknown, isStale: boolean }> }}
 */
export const createTtlCache = ({ ttlMs }) => {
  /** @type {Map<string, { value: unknown, expiresAtMs: number }>} */
  const entriesByKey = new Map()

  /**
   * Returns the cached value while it is fresh, otherwise fetches a new one. If fetching
   * fails and there is an expired value, that is returned with `isStale: true`; with nothing
   * to fall back on, the error is rethrown for the caller to handle.
   */
  const getOrFetch = async (key, fetchValue) => {
    const cached = entriesByKey.get(key)

    if (cached && cached.expiresAtMs > Date.now()) {
      return { value: cached.value, isStale: false }
    }

    try {
      const value = await fetchValue()
      entriesByKey.set(key, { value, expiresAtMs: Date.now() + ttlMs })
      return { value, isStale: false }
    } catch (fetchError) {
      if (!cached) throw fetchError
      return { value: cached.value, isStale: true }
    }
  }

  return { getOrFetch }
}
