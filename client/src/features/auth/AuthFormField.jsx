import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { cn } from '@/lib/utils.js'

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
