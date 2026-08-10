import {
  getQuizOptions,
  loadPreferences,
  savePreferences,
} from '../services/preferencesService.js'

export const getQuizOptionsForClient = (_request, response) => {
  response.json(getQuizOptions())
}

export const getPreferences = async (request, response) => {
  const preferences = await loadPreferences(request.userId)
  response.json({ preferences })
}

export const replacePreferences = async (request, response) => {
  const user = await savePreferences(request.userId, request.body)
  response.json({ user })
}
