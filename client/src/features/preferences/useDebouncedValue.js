import { useEffect, useState } from 'react'

/**
 * The value, but only after it has stopped changing for `delayMs`.
 *
 * Search runs on what this returns rather than on every keystroke: a coin id is worth one
 * request, not one per letter of the word somebody is still typing.
 *
 * @param {string} value
 * @param {number} delayMs
 * @returns {string}
 */
export const useDebouncedValue = (value, delayMs) => {
  const [settledValue, setSettledValue] = useState(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => setSettledValue(value), delayMs)

    return () => clearTimeout(timeoutId)
  }, [value, delayMs])

  return settledValue
}
