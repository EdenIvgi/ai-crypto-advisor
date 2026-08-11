import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { postVote, deleteVote, fetchMyVotes } from './feedbackApi.js'

const MY_VOTES_QUERY_KEY = ['feedback', 'mine']

const isSameContent = (vote, sectionType, contentId) =>
  vote.sectionType === sectionType && vote.contentId === contentId

/**
 * This content's vote after the change: replaced, added, or — when `vote` is null — taken away.
 *
 * Pure, and it mirrors what the server does with each of the two requests, because the optimistic
 * state has to match what comes back or the thumb would visibly jump when the request settles.
 */
const withVoteApplied = (votes, { sectionType, contentId, vote }) => {
  const otherVotes = votes.filter(
    (existing) => !isSameContent(existing, sectionType, contentId)
  )

  return vote ? [...otherVotes, { sectionType, contentId, vote }] : otherVotes
}

/**
 * Every vote this person has cast, fetched once for the whole dashboard rather than per
 * section. Without it a reload would show four unpressed thumbs over opinions the database
 * still holds, which reads as the votes not having saved.
 */
export const useMyVotes = () =>
  useQuery({
    queryKey: MY_VOTES_QUERY_KEY,
    queryFn: fetchMyVotes,
    staleTime: Infinity,
  })

/**
 * The vote state of one section's current content, and the way to change it.
 *
 * The update is optimistic because a thumb that waits for a round trip feels broken, and
 * because nothing downstream depends on the vote having landed — if the request fails the
 * previous state is put back and the interface says so.
 *
 * @param {{ sectionType: string, contentId: string | undefined }} target
 * @returns {{ currentVote: 'up' | 'down' | null, toggleVote: (vote: 'up' | 'down') => void, hasFailed: boolean }}
 */
export const useFeedbackVote = ({ sectionType, contentId }) => {
  const queryClient = useQueryClient()
  const myVotes = useMyVotes()

  const currentVote =
    myVotes.data?.votes.find((vote) => isSameContent(vote, sectionType, contentId))?.vote ??
    null

  const voteMutation = useMutation({
    // One mutation for both directions, because to a reader they are one gesture: the thumb is
    // pressed or it is not. `null` is the request to withdraw.
    mutationFn: (nextVote) =>
      nextVote
        ? postVote({ sectionType, contentId, vote: nextVote })
        : deleteVote({ sectionType, contentId }),

    onMutate: async (nextVote) => {
      // Any refetch already in flight would land after this and undo it.
      await queryClient.cancelQueries({ queryKey: MY_VOTES_QUERY_KEY })

      const previousVotes = queryClient.getQueryData(MY_VOTES_QUERY_KEY)

      queryClient.setQueryData(MY_VOTES_QUERY_KEY, (current) =>
        current
          ? {
              votes: withVoteApplied(current.votes, { sectionType, contentId, vote: nextVote }),
            }
          : current
      )

      return { previousVotes }
    },

    onError: (_error, _nextVote, context) => {
      queryClient.setQueryData(MY_VOTES_QUERY_KEY, context.previousVotes)
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: MY_VOTES_QUERY_KEY }),
  })

  /**
   * Pressing an unpressed thumb records that opinion; pressing the pressed one takes it back.
   *
   * Withdrawing matters because the alternative is a trap: with only "up" and "down" available,
   * a mis-click can be reversed but never undone, so somebody who did not mean to say anything
   * is forced to leave an opinion they do not hold in the data. An empty state has to be
   * reachable from a filled one.
   */
  const toggleVote = (vote) => {
    if (!contentId) return

    voteMutation.mutate(vote === currentVote ? null : vote)
  }

  return { currentVote, toggleVote, hasFailed: voteMutation.isError }
}
