import { SelectableOption } from '../components/SelectableOption.jsx'

/** What each section actually puts on the dashboard, so the choice is concrete. */
const CONTENT_SECTION_DESCRIPTIONS = {
  coin_prices: 'Live prices and the last 24 hours for the assets you picked.',
  market_news: 'Headlines filtered down to those assets.',
  ai_insight: 'A few sentences each morning, written for how you invest.',
  fun_meme: 'One crypto meme. It changes daily.',
}

/** Multiple choice. Anything left unpicked simply will not appear on the dashboard. */
export const ContentPreferencesStep = ({
  contentSections,
  selectedSections,
  onToggleSection,
}) => {
  return (
    <fieldset>
      <legend className="sr-only">Sections to show</legend>

      <div className="grid gap-2">
        {contentSections.map(({ value, label }) => (
          <SelectableOption
            key={value}
            isSelected={selectedSections.includes(value)}
            onToggle={() => onToggleSection(value)}
            title={label}
            subtitle={CONTENT_SECTION_DESCRIPTIONS[value]}
          />
        ))}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Anything you leave out will not appear on your dashboard. You can change this later.
      </p>
    </fieldset>
  )
}
