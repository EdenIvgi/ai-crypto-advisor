import { SUPPORTED_ASSETS } from '../data/supportedAssets.js'
import { MOCK_COIN_PRICES } from '../data/mockDashboard.js'
import { getTodayDateKey } from '../lib/dateKeys.js'

const ASSETS_BY_ID = new Map(SUPPORTED_ASSETS.map((asset) => [asset.id, asset]))

/**
 * Prices for the assets this user follows, in the order they were chosen.
 *
 * M8 replaces the body of this function with a cached CoinGecko call and keeps the signature
 * and the return shape exactly as they are here. Ids with no entry are dropped rather than
 * returned as blanks: a row with no price is worse than no row.
 *
 * @param {string[]} watchedAssetIds - CoinGecko ids, e.g. ['bitcoin', 'ethereum']
 * @returns {Promise<{ contentId: string, coins: Array<{ id: string, symbol: string, name: string, priceUsd: number, change24hPercent: number }>, isFallback: boolean }>}
 */
export const loadCoinPrices = async (watchedAssetIds) => {
  const coins = watchedAssetIds
    .filter((assetId) => ASSETS_BY_ID.has(assetId) && MOCK_COIN_PRICES[assetId])
    .map((assetId) => ({
      id: assetId,
      symbol: ASSETS_BY_ID.get(assetId).symbol,
      name: ASSETS_BY_ID.get(assetId).name,
      ...MOCK_COIN_PRICES[assetId],
    }))

  // A vote here is about the day's prices rather than about one coin, so the day is what
  // identifies it. Prices change by the minute; an id that changed with them would record
  // an opinion about a number nobody could look up again.
  return { contentId: getTodayDateKey(), coins, isFallback: true }
}
