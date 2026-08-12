import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button.jsx'
import { useCurrentUser } from '@/features/auth/useAuth.js'

import { useQuizOptions, useSavePreferences } from './usePreferences.js'
import { toggleSelection, toggleAssetSelection } from './toggleSelection.js'
import { AssetSelectionQuestion } from './questions/AssetSelectionQuestion.jsx'
import { InvestorTypeQuestion } from './questions/InvestorTypeQuestion.jsx'
import { ContentPreferencesQuestion } from './questions/ContentPreferencesQuestion.jsx'

const isSameSelection = (left, right) =>
  left.length === right.length && [...left].sort().join() === [...right].sort().join()

export const SettingsPage = () => {
  const { user } = useCurrentUser()
  const quizOptions = useQuizOptions()
  const savePreferences = useSavePreferences()

  const savedAnswers = user.preferences

  const [draftAnswers, setDraftAnswers] = useState(() => ({
    watchedAssets: [...savedAnswers.watchedAssets],
    investorType: savedAnswers.investorType,
    contentSections: [...savedAnswers.contentSections],
  }))

  const hasUnsavedChanges =
    !isSameSelection(
      draftAnswers.watchedAssets.map((asset) => asset.id),
      savedAnswers.watchedAssets.map((asset) => asset.id)
    ) ||
    draftAnswers.investorType !== savedAnswers.investorType ||
    !isSameSelection(draftAnswers.contentSections, savedAnswers.contentSections)

  const isAnswerSetComplete =
    draftAnswers.watchedAssets.length > 0 &&
    Boolean(draftAnswers.investorType) &&
    draftAnswers.contentSections.length > 0

  const toggleAnswerIn = (field) => (value) =>
    setDraftAnswers((current) => ({
      ...current,
      [field]: toggleSelection(current[field], value),
    }))

  const toggleAsset = (asset) =>
    setDraftAnswers((current) => ({
      ...current,
      watchedAssets: toggleAssetSelection(current.watchedAssets, asset),
    }))

  if (quizOptions.isPending) return <SettingsPlaceholder />

  if (quizOptions.isError) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p role="alert" className="text-sm text-destructive">
          {quizOptions.error.message}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => quizOptions.refetch()}>
          Try again
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:px-6 sm:py-14">
      <header>
        <p className="eyebrow">Settings</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">
          Your preferences
        </h1>
        <p className="mt-3 text-pretty text-muted-foreground">
          The answers you gave when you signed up. Change them and your dashboard is rebuilt
          from the new ones.
        </p>
      </header>

      <div className="mt-10 space-y-10">
        <SettingsSection
          heading="Assets you follow"
          guidance="Prices and news are drawn from these."
        >
          <AssetSelectionQuestion
            suggestedAssets={quizOptions.data.assets}
            selectedAssets={draftAnswers.watchedAssets}
            onToggleAsset={toggleAsset}
          />
        </SettingsSection>

        <SettingsSection
          heading="How you invest"
          guidance="Sets the tone of the insight written for you. Changing it rewrites today's."
        >
          <InvestorTypeQuestion
            investorTypes={quizOptions.data.investorTypes}
            selectedInvestorType={draftAnswers.investorType}
            onChange={(investorType) =>
              setDraftAnswers((current) => ({ ...current, investorType }))
            }
          />
        </SettingsSection>

        <SettingsSection
          heading="Sections to show"
          guidance="Your dashboard is built from exactly what you pick here."
        >
          <ContentPreferencesQuestion
            contentSections={quizOptions.data.contentSections}
            selectedSections={draftAnswers.contentSections}
            onToggleSection={toggleAnswerIn('contentSections')}
          />
        </SettingsSection>
      </div>

      {savePreferences.isError ? (
        <p role="alert" className="mt-8 text-sm text-destructive">
          {savePreferences.error.message}
        </p>
      ) : null}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
        <Button variant="ghost" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges ? (
            <Button
              variant="ghost"
              onClick={() =>
                setDraftAnswers({
                  watchedAssets: [...savedAnswers.watchedAssets],
                  investorType: savedAnswers.investorType,
                  contentSections: [...savedAnswers.contentSections],
                })
              }
              disabled={savePreferences.isPending}
            >
              Discard changes
            </Button>
          ) : null}

          <Button
            onClick={() => savePreferences.mutate(draftAnswers)}
            disabled={!hasUnsavedChanges || !isAnswerSetComplete || savePreferences.isPending}
            className="min-w-32"
          >
            {savePreferences.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>

      {/* Says why the button is unavailable, rather than leaving a dead control to be poked at. */}
      <p className="mt-3 text-right text-sm text-muted-foreground" aria-live="polite">
        {!isAnswerSetComplete
          ? 'Each question needs at least one answer.'
          : hasUnsavedChanges
            ? 'You have unsaved changes.'
            : 'Everything here is saved.'}
      </p>
    </main>
  )
}

const SettingsSection = ({ heading, guidance, children }) => (
  <section>
    <h2 className="text-lg font-semibold tracking-tight">{heading}</h2>
    <p className="mt-1 mb-5 text-sm text-muted-foreground">{guidance}</p>
    {children}
  </section>
)

const SettingsPlaceholder = () => (
  <main
    className="mx-auto max-w-2xl px-5 py-10 sm:px-6 sm:py-14"
    role="status"
    aria-live="polite"
  >
    <span className="sr-only">Loading your preferences</span>
    <div className="skeleton h-4 w-24" />
    <div className="skeleton mt-4 h-9 w-2/3" />
    <div className="skeleton mt-3 h-5 w-full" />
    <div className="mt-10 grid gap-2 sm:grid-cols-2">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="skeleton h-[4.5rem] rounded-lg" />
      ))}
    </div>
  </main>
)
