import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { postVote, fetchMyVotes } from './feedbackApi.js'

const MY_VOTES_QUERY_KEY = ['feedback', 'mine']

const isSameContent = (vote, sectionType, contentId) =>
  vote.sectionType === sectionType && vote.contentId === contentId

/**
 * Replaces this piece of content's vote, or adds it if there is not one yet. Pure, and
 * mirrors what the server's upsert does — the optimistic state has to match what comes back
 * or the thumb would jump when the request settles.
 */
const withVoteApplied = (votes, castVote) => [
  ...votes.filter((vote) => !isSameContent(vote, castVote.sectionType, castVote.contentId)),
  castVote,
]

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
 * @returns {{ currentVote: 'up' | 'down' | null, castVote: (vote: 'up' | 'down') => void, hasFailed: boolean }}
 */
export const useFeedbackVote = ({ sectionType, contentId }) => {
  const queryClient = useQueryClient()
  const myVotes = useMyVotes()

  const currentVote =
    myVotes.data?.votes.find((vote) => isSameContent(vote, sectionType, contentId))?.vote ??
    null

  const voteMutation = useMutation({
    mutationFn: (vote) => postVote({ sectionType, contentId, vote }),

    onMutate: async (vote) => {
      // Any refetch already in flight would land after this and undo it.
      await queryClient.cancelQueries({ queryKey: MY_VOTES_QUERY_KEY })

      const previousVotes = queryClient.getQueryData(MY_VOTES_QUERY_KEY)

      queryClient.setQueryData(MY_VOTES_QUERY_KEY, (current) =>
        current
          ? { votes: withVoteApplied(current.votes, { sectionType, contentId, vote }) }
          : current
      )

      return { previousVotes }
    },

    onError: (_error, _vote, context) => {
      queryClient.setQueryData(MY_VOTES_QUERY_KEY, context.previousVotes)
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey: MY_VOTES_QUERY_KEY }),
  })

  const castVote = (vote) => {
    // Pressing the thumb that is already pressed asks for nothing, so it sends nothing.
    // There is no un-vote: an opinion, once given, is either kept or reversed.
    if (!contentId || vote === currentVote) return
    voteMutation.mutate(vote)
  }

  return { currentVote, castVote, hasFailed: voteMutation.isError }
}
