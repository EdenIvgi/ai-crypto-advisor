import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { cn } from '@/lib/utils.js'

/**
 * A labelled input that shows the server's message for this field. `aria-describedby` and
 * `aria-invalid` are what let a screen reader announce the problem, so the error is not
 * something only sighted users get told about.
 */
export const AuthFormField = ({ id, label, error, className, ...inputProps }) => {
  const errorId = `${id}-error`

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(error && 'border-destructive', className)}
        {...inputProps}
      />
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
