import { requestApi } from '@/lib/apiClient.js'

export const postVote = ({ sectionType, contentId, vote }) =>
  requestApi('/api/feedback', { method: 'POST', body: { sectionType, contentId, vote } })

/**
 * Withdraws this reader's vote on one piece of content. The target travels in the query string
 * because a body on DELETE has no agreed meaning and intermediaries may drop it;
 * `URLSearchParams` is what keeps a `contentId` containing a colon from corrupting the URL.
 */
export const deleteVote = ({ sectionType, contentId }) =>
  requestApi(`/api/feedback?${new URLSearchParams({ sectionType, contentId })}`, {
    method: 'DELETE',
  })

export const fetchMyVotes = () => requestApi('/api/feedback/mine')
