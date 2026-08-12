export const createTtlCache = ({ ttlMs }) => {
  const entriesByKey = new Map()

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
