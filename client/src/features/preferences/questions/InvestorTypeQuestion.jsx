import { SelectableOption } from '../components/SelectableOption.jsx'

/** What each style means, in the reader's terms rather than the database's. */
const INVESTOR_TYPE_DESCRIPTIONS = {
  hodler: 'You buy and hold. Daily noise is noise.',
  day_trader: 'You are in and out, and the charts matter today.',
  nft_collector: 'You follow collections, drops, and the culture around them.',
}

/** Single choice, with radio semantics so it announces as one-of-these. */
export const InvestorTypeQuestion = ({ investorTypes, selectedInvestorType, onChange }) => (
  <div role="radiogroup" aria-label="How you invest" className="grid gap-2">
    {investorTypes.map(({ value, label }) => (
      <SelectableOption
        key={value}
        isSingleChoice
        isSelected={selectedInvestorType === value}
        onToggle={() => onChange(value)}
        title={label}
        subtitle={INVESTOR_TYPE_DESCRIPTIONS[value]}
      />
    ))}
  </div>
)
