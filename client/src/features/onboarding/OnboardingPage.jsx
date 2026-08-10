import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button.jsx'
import { useCurrentUser } from '@/features/auth/useAuth.js'

import { useQuizOptions, useSavePreferences } from './useOnboarding.js'
import { toggleSelection } from './toggleSelection.js'
import { AssetSelectionStep } from './steps/AssetSelectionStep.jsx'
import { InvestorTypeStep } from './steps/InvestorTypeStep.jsx'
import { ContentPreferencesStep } from './steps/ContentPreferencesStep.jsx'

const QUIZ_STEPS = [
  {
    key: 'assets',
    question: 'What do you follow?',
    guidance: 'Pick the assets you actually care about. Prices and news will follow these.',
  },
  {
    key: 'investorType',
    question: 'How do you invest?',
    guidance: 'This sets the tone of the insight written for you each morning.',
  },
  {
    key: 'contentSections',
    question: 'What should we show you?',
    guidance: 'Your dashboard is built from exactly what you pick here.',
  },
]

const EMPTY_ANSWERS = {
  watchedAssetIds: [],
  investorType: null,
  contentSections: [],
}

/**
 * Three questions, held in local state and submitted once at the end. Saving step by step
 * would leave half-answered accounts in the database, and `preferences` being absent is
 * precisely what marks someone as not yet onboarded.
 */
export const OnboardingPage = () => {
  const { user } = useCurrentUser()
  const quizOptions = useQuizOptions()
  const savePreferences = useSavePreferences()

  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState(EMPTY_ANSWERS)

  const currentStep = QUIZ_STEPS[stepIndex]
  const isFinalStep = stepIndex === QUIZ_STEPS.length - 1

  const canContinueFromStep = {
    assets: answers.watchedAssetIds.length > 0,
    investorType: Boolean(answers.investorType),
    contentSections: answers.contentSections.length > 0,
  }[currentStep.key]

  const goToNextStep = () => {
    if (!isFinalStep) return setStepIndex(stepIndex + 1)
    savePreferences.mutate(answers)
  }

  /**
   * Updating from the previous state rather than from `answers` directly. Two clicks landing
   * in the same render would otherwise both read the same stale selection, and the second
   * would silently discard the first.
   */
  const toggleAnswerIn = (field) => (value) =>
    setAnswers((current) => ({ ...current, [field]: toggleSelection(current[field], value) }))

  if (quizOptions.isPending) return <QuizPlaceholder />

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
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <p className="eyebrow mb-6">
        Step {stepIndex + 1} of {QUIZ_STEPS.length}
      </p>

      <StepProgress currentIndex={stepIndex} totalSteps={QUIZ_STEPS.length} />

      <header className="mt-8 mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          {stepIndex === 0 && user?.name ? `${user.name}, ` : ''}
          {stepIndex === 0 ? currentStep.question.toLowerCase() : currentStep.question}
        </h1>
        <p className="text-muted-foreground">{currentStep.guidance}</p>
      </header>

      {currentStep.key === 'assets' ? (
        <AssetSelectionStep
          assets={quizOptions.data.assets}
          selectedAssetIds={answers.watchedAssetIds}
          onToggleAsset={toggleAnswerIn('watchedAssetIds')}
        />
      ) : null}

      {currentStep.key === 'investorType' ? (
        <InvestorTypeStep
          investorTypes={quizOptions.data.investorTypes}
          selectedInvestorType={answers.investorType}
          onChange={(investorType) => setAnswers((current) => ({ ...current, investorType }))}
        />
      ) : null}

      {currentStep.key === 'contentSections' ? (
        <ContentPreferencesStep
          contentSections={quizOptions.data.contentSections}
          selectedSections={answers.contentSections}
          onToggleSection={toggleAnswerIn('contentSections')}
        />
      ) : null}

      {savePreferences.isError ? (
        <p role="alert" className="mt-6 text-sm text-destructive">
          {savePreferences.error.message}
        </p>
      ) : null}

      <div className="mt-10 flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          onClick={() => setStepIndex(stepIndex - 1)}
          disabled={stepIndex === 0}
          className={stepIndex === 0 ? 'invisible' : ''}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <Button
          onClick={goToNextStep}
          disabled={!canContinueFromStep || savePreferences.isPending}
          className="min-w-36"
        >
          {savePreferences.isPending
            ? 'Building your dashboard…'
            : isFinalStep
              ? 'Show me my dashboard'
              : 'Continue'}
        </Button>
      </div>
    </main>
  )
}

const StepProgress = ({ currentIndex, totalSteps }) => (
  <div
    className="flex gap-1.5"
    role="progressbar"
    aria-valuenow={currentIndex + 1}
    aria-valuemin={1}
    aria-valuemax={totalSteps}
    aria-label="Onboarding progress"
  >
    {Array.from({ length: totalSteps }, (_, index) => (
      <span
        key={index}
        className={`h-1 flex-1 rounded-full transition-colors ${
          index <= currentIndex ? 'bg-primary' : 'bg-border'
        }`}
      />
    ))}
  </div>
)

const QuizPlaceholder = () => (
  <main className="mx-auto max-w-2xl px-6 py-16" role="status" aria-live="polite">
    <span className="sr-only">Loading the questions</span>
    <div className="h-1 w-full rounded-full bg-border" />
    <div className="mt-8 h-9 w-2/3 animate-pulse rounded bg-muted" />
    <div className="mt-3 h-5 w-full animate-pulse rounded bg-muted" />
    <div className="mt-8 grid gap-2 sm:grid-cols-2">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="h-[4.5rem] animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  </main>
)
