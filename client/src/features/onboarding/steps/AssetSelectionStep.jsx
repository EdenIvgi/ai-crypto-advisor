import { SelectableOption } from '../components/SelectableOption.jsx'

const MAX_WATCHED_ASSETS = 8

/**
 * Multiple choice, capped at eight. The cap is the server's, and it is enforced here by
 * disabling the unpicked options once the limit is reached — the person finds out before
 * they submit, not after.
 */
export const AssetSelectionStep = ({ assets, selectedAssetIds, onToggleAsset }) => {
  const hasReachedLimit = selectedAssetIds.length >= MAX_WATCHED_ASSETS

  return (
    <fieldset>
      <legend className="sr-only">Assets to follow</legend>

      <div className="grid gap-2 sm:grid-cols-2">
        {assets.map((asset) => {
          const isSelected = selectedAssetIds.includes(asset.id)

          return (
            <SelectableOption
              key={asset.id}
              isSelected={isSelected}
              isDisabled={!isSelected && hasReachedLimit}
              onToggle={() => onToggleAsset(asset.id)}
              title={asset.name}
              subtitle={<span className="font-mono">{asset.symbol}</span>}
            />
          )
        })}
      </div>

      <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
        {selectedAssetIds.length} of {MAX_WATCHED_ASSETS} picked
        {hasReachedLimit ? ' — that is the limit for one dashboard' : ''}
      </p>
    </fieldset>
  )
}
