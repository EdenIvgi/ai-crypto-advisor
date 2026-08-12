import { useEffect, useState } from 'react'

export const useDebouncedValue = (value, delayMs) => {
  const [settledValue, setSettledValue] = useState(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => setSettledValue(value), delayMs)

    return () => clearTimeout(timeoutId)
  }, [value, delayMs])

  return settledValue
}
