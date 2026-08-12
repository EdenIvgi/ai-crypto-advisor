import { SelectableOption } from '../components/SelectableOption.jsx'

const INVESTOR_TYPE_DESCRIPTIONS = {
  hodler: 'You buy and hold. Daily noise is noise.',
  day_trader: 'You are in and out, and the charts matter today.',
  nft_collector: 'You follow collections, drops, and the culture around them.',
}

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
