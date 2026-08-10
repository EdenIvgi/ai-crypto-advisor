import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button.jsx'

import { AuthLayout } from './AuthLayout.jsx'
import { AuthFormField } from './AuthFormField.jsx'
import { DemoAccountButton } from './DemoAccountButton.jsx'
import { useSignup } from './useAuth.js'

export const SignupPage = () => {
  const [registration, setRegistration] = useState({ name: '', email: '', password: '' })
  const signup = useSignup()

  const updateField = (field) => (event) =>
    setRegistration((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    signup.mutate(registration)
  }

  const fieldErrors = signup.error?.fieldErrors ?? {}
  // A duplicate email arrives as a 409 with no field attached, so it is shown above the form.
  const formError = signup.isError && !signup.error.fieldErrors ? signup.error.message : null

  return (
    <AuthLayout
      eyebrow="Three questions away"
      title="Create your account"
      description="Then tell us what you follow, and the dashboard builds itself around it."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {formError ? (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {formError}
          </p>
        ) : null}

        <AuthFormField
          id="name"
          label="Name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          value={registration.name}
          onChange={updateField('name')}
          error={fieldErrors.name}
          required
        />

        <AuthFormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={registration.email}
          onChange={updateField('email')}
          error={fieldErrors.email}
          required
        />

        <AuthFormField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={registration.password}
          onChange={updateField('password')}
          error={fieldErrors.password}
          required
        />
        <p className="-mt-3 text-xs text-muted-foreground">At least 8 characters.</p>

        <Button type="submit" className="w-full" disabled={signup.isPending}>
          {signup.isPending ? 'Creating your account…' : 'Create account'}
        </Button>
      </form>

      <div className="mt-6">
        <DemoAccountButton />
      </div>
    </AuthLayout>
  )
}
