import { useState } from 'react'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Button } from '@/components/ui/button.jsx'

import { SelectableOption } from '../components/SelectableOption.jsx'
import { useAssetSearch, MINIMUM_SEARCH_LENGTH } from '../usePreferences.js'
import { useDebouncedValue } from '../useDebouncedValue.js'

const MAX_WATCHED_ASSETS = 12
const SEARCH_DEBOUNCE_MS = 300

/**
 * The eight suggestions are a starting point, not the choice: anything CoinGecko lists can be
 * found through the search box above them. A coin picked from a search is shown alongside the
 * suggestions afterwards, so it can be seen and unpicked without being searched for again.
 *
 * The cap is the server's, enforced here by disabling the unpicked options once it is reached —
 * the person finds out before they submit, not after.
 */
export const AssetSelectionQuestion = ({ suggestedAssets, selectedAssets, onToggleAsset }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS)
  const search = useAssetSearch(debouncedSearchTerm)

  const hasReachedLimit = selectedAssets.length >= MAX_WATCHED_ASSETS
  const isSearching = searchTerm.trim().length >= MINIMUM_SEARCH_LENGTH

  const pickedElsewhere = selectedAssets.filter(
    (asset) => !suggestedAssets.some((suggested) => suggested.id === asset.id)
  )

  const visibleAssets = isSearching
    ? (search.data?.assets ?? [])
    : [...suggestedAssets, ...pickedElsewhere]

  return (
    <fieldset>
      <legend className="sr-only">Assets to follow</legend>

      <div className="mb-5">
        <Label htmlFor="asset-search" className="sr-only">
          Search for a coin
        </Label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="asset-search"
            type="search"
            className="pl-9"
            placeholder="Search any coin — Avalanche, PEPE, Monero…"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      {isSearching && search.isPending ? <SearchStatus>Searching…</SearchStatus> : null}

      {isSearching && search.isError ? (
        <div role="alert" className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-sm text-destructive">{search.error.message}</p>
          <Button variant="outline" size="sm" onClick={() => search.refetch()}>
            Try again
          </Button>
        </div>
      ) : null}

      {isSearching && search.isSuccess && visibleAssets.length === 0 ? (
        <SearchStatus>No coin matches “{searchTerm.trim()}”.</SearchStatus>
      ) : null}

      {visibleAssets.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {visibleAssets.map((asset) => {
            const isSelected = selectedAssets.some((selected) => selected.id === asset.id)

            return (
              <SelectableOption
                key={asset.id}
                isSelected={isSelected}
                isDisabled={!isSelected && hasReachedLimit}
                onToggle={() => onToggleAsset(asset)}
                title={asset.name}
                subtitle={<span className="font-mono">{asset.symbol}</span>}
              />
            )
          })}
        </div>
      ) : null}

      <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
        {selectedAssets.length} of {MAX_WATCHED_ASSETS} picked
        {hasReachedLimit ? ' — that is the limit for one dashboard' : ''}
      </p>
    </fieldset>
  )
}

const SearchStatus = ({ children }) => (
  <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
    {children}
  </p>
)
