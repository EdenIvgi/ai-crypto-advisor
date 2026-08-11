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
