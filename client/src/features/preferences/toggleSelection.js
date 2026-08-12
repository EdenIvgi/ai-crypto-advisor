/**
 * Adds a value to a selection, or removes it if it is already there.
 *
 * @param {string[]} selectedValues
 * @param {string} value
 * @returns {string[]}
 */
export const toggleSelection = (selectedValues, value) =>
  selectedValues.includes(value)
    ? selectedValues.filter((selected) => selected !== value)
    : [...selectedValues, value]

/**
 * The same, for assets, which are compared by id rather than by identity — the object a coin
 * arrives in differs between a search result and a saved preference.
 *
 * @param {Array<{ id: string, name: string, symbol: string }>} selectedAssets
 * @param {{ id: string, name: string, symbol: string }} asset
 * @returns {Array<{ id: string, name: string, symbol: string }>}
 */
export const toggleAssetSelection = (selectedAssets, asset) =>
  selectedAssets.some((selected) => selected.id === asset.id)
    ? selectedAssets.filter((selected) => selected.id !== asset.id)
    : [...selectedAssets, asset]
