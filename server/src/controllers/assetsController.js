import { searchAssets } from '../services/assetSearchService.js'

export const getAssetSearchResults = async (request, response) => {
  response.json(await searchAssets(request.query.query))
}
