/**
 * The assets someone can choose to follow. Deliberately a short, curated list rather than
 * CoinGecko's full catalogue: a quiz with ten thousand options is not a quiz, and every id
 * here is one this app can actually price.
 *
 * `id` is the CoinGecko coin id and is what gets stored on the user and sent to
 * `/coins/markets`. It is not always what you would guess from the symbol — XRP is `ripple`
 * and AVAX is `avalanche-2` — so these were verified against the live API rather than typed
 * from memory.
 */
export const SUPPORTED_ASSETS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin' },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap' },
  { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos Hub' },
]

export const SUPPORTED_ASSET_IDS = SUPPORTED_ASSETS.map((asset) => asset.id)
