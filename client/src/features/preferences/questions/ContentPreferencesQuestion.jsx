import { SelectableOption } from '../components/SelectableOption.jsx'

const CONTENT_SECTION_DESCRIPTIONS = {
  coin_prices: 'Live prices and the last 24 hours for the assets you picked.',
  // Not "filtered down to those assets": headlines about them are lifted to the top, and the
  // rest of the feed still shows. Filtering was dropped because matching a headline to a coin is
  // a guess, and a wrong guess would cost the reader an article.
  market_news: 'Headlines from four publishers, with the ones about those assets first.',
  ai_insight: 'A few sentences each morning, written for how you invest.',
  fun_meme: 'One crypto meme. It changes daily.',
}

export const ContentPreferencesQuestion = ({
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
