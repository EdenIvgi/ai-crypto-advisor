import { requestApi } from '@/lib/apiClient.js'

export const postVote = ({ sectionType, contentId, vote }) =>
  requestApi('/api/feedback', { method: 'POST', body: { sectionType, contentId, vote } })

export const deleteVote = ({ sectionType, contentId }) =>
  requestApi(`/api/feedback?${new URLSearchParams({ sectionType, contentId })}`, {
    method: 'DELETE',
  })

export const fetchMyVotes = () => requestApi('/api/feedback/mine')
