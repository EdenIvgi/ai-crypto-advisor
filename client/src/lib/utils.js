import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges conditional class names and resolves conflicting Tailwind utilities, so a caller
 * can override a component's default (`cn('p-2', 'p-6')` keeps `p-6`). Every shadcn/ui
 * component depends on this helper existing at this path.
 */
export const cn = (...classValues) => twMerge(clsx(classValues))
