import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

/**
 * Flat config for the whole monorepo. The client and the server run in different
 * environments, so each gets its own globals and plugins rather than a shared lowest
 * common denominator.
 */
export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      'client/src/components/ui/**',
    ],
  },

  js.configs.recommended,

  {
    name: 'shared-rules',
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'smart'],
    },
  },

  {
    name: 'server',
    files: ['server/**/*.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  {
    name: 'client',
    files: ['client/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  {
    name: 'config-files',
    files: ['*.config.js', 'client/*.config.js', 'server/*.config.js', '.claude/hooks/*.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
]
