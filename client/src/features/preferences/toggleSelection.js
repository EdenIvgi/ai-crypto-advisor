export const toggleSelection = (selectedValues, value) =>
  selectedValues.includes(value)
    ? selectedValues.filter((selected) => selected !== value)
    : [...selectedValues, value]

export const toggleAssetSelection = (selectedAssets, asset) =>
  selectedAssets.some((selected) => selected.id === asset.id)
    ? selectedAssets.filter((selected) => selected.id !== asset.id)
    : [...selectedAssets, asset]
