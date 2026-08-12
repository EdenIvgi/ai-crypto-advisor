import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { postVote, deleteVote, fetchMyVotes } from './feedbackApi.js'

const MY_VOTES_QUERY_KEY = ['feedback', 'mine']

const isSameContent = (vote, sectionType, contentId) =>
  vote.sectionType === sectionType && vote.contentId === contentId

const withVoteApplied = (votes, { sectionType, contentId, vote }) => {
  const otherVotes = votes.filter(
    (existing) => !isSameContent(existing, sectionType, contentId)
  )

  return vote ? [...otherVotes, { sectionType, contentId, vote }] : otherVotes
}

export const useMyVotes = () =>
  useQuery({
    queryKey: MY_VOTES_QUERY_KEY,
    queryFn: fetchMyVotes,
    staleTime: Infinity,
  })

export const useFeedbackVote = ({ sectionType, contentId }) => {
  const queryClient = useQueryClient()
  const myVotes = useMyVotes()

  const currentVote =
    myVotes.data?.votes.find((vote) => isSameContent(vote, sectionType, contentId))?.vote ??
    null

  const voteMutation = useMutation({
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

  const toggleVote = (vote) => {
    if (!contentId) return

    voteMutation.mutate(vote === currentVote ? null : vote)
  }

  return { currentVote, toggleVote, hasFailed: voteMutation.isError }
}
