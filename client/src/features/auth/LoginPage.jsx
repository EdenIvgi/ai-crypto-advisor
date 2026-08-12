import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button.jsx'

import { AuthLayout } from './AuthLayout.jsx'
import { AuthFormField } from './AuthFormField.jsx'
import { DemoAccountButton } from './DemoAccountButton.jsx'
import { useLogin } from './useAuth.js'

export const LoginPage = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const login = useLogin()

  const updateField = (field) => (event) =>
    setCredentials((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    login.mutate(credentials)
  }

  const fieldErrors = login.error?.fieldErrors ?? {}
  const formError = login.isError && !login.error.fieldErrors ? login.error.message : null

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in"
      description="Your dashboard is where you left it."
      footer={
        <>
          New here?{' '}
          <Link
            to="/signup"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Create an account
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
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={credentials.email}
          onChange={updateField('email')}
          error={fieldErrors.email}
          required
        />

        <AuthFormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={credentials.password}
          onChange={updateField('password')}
          error={fieldErrors.password}
          required
        />

        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-6">
        <DemoAccountButton />
      </div>
    </AuthLayout>
  )
}
