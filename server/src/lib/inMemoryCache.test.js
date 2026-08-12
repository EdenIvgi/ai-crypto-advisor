import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { createTtlCache } from './inMemoryCache.js'

const TTL_MS = 60_000

describe('inMemoryCache', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('serves the cached value without calling the fetcher again inside the TTL', async () => {
    const cache = createTtlCache({ ttlMs: TTL_MS })
    const fetchValue = vi.fn().mockResolvedValue('first')

    const first = await cache.getOrFetch('coins', fetchValue)
    vi.advanceTimersByTime(TTL_MS - 1)
    const second = await cache.getOrFetch('coins', fetchValue)

    expect(fetchValue).toHaveBeenCalledTimes(1)
    expect(second).toEqual({ value: 'first', isStale: false })
    expect(first.value).toBe(second.value)
  })

  it('fetches again once the TTL has passed', async () => {
    const cache = createTtlCache({ ttlMs: TTL_MS })
    const fetchValue = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second')

    await cache.getOrFetch('coins', fetchValue)
    vi.advanceTimersByTime(TTL_MS + 1)
    const afterExpiry = await cache.getOrFetch('coins', fetchValue)

    expect(fetchValue).toHaveBeenCalledTimes(2)
    expect(afterExpiry).toEqual({ value: 'second', isStale: false })
  })

  /*
   * The remaining three cover serving stale data, which is the reason this cache exists
   * rather than a plain Map with a timestamp. A cache that only caches would let one rate
   * limit from a free API empty a section of the dashboard.
   */
  it('serves the expired value when the fetcher fails, and says it is stale', async () => {
    const cache = createTtlCache({ ttlMs: TTL_MS })
    const fetchValue = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockRejectedValueOnce(new Error('429 Too Many Requests'))

    await cache.getOrFetch('coins', fetchValue)
    vi.advanceTimersByTime(TTL_MS + 1)

    expect(await cache.getOrFetch('coins', fetchValue)).toEqual({
      value: 'first',
      isStale: true,
    })
  })

  it('rethrows when the fetcher fails and there is nothing to fall back on', async () => {
    const cache = createTtlCache({ ttlMs: TTL_MS })
    const fetchValue = vi.fn().mockRejectedValue(new Error('network unreachable'))

    await expect(cache.getOrFetch('coins', fetchValue)).rejects.toThrow('network unreachable')
  })

  it('keeps separate keys apart', async () => {
    const cache = createTtlCache({ ttlMs: TTL_MS })

    await cache.getOrFetch('bitcoin', vi.fn().mockResolvedValue('one'))
    const other = await cache.getOrFetch('ethereum', vi.fn().mockResolvedValue('two'))

    expect(other.value).toBe('two')
    expect((await cache.getOrFetch('bitcoin', vi.fn())).value).toBe('one')
  })
})
