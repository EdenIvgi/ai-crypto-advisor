import mongoose from 'mongoose'

import { CONTENT_SECTIONS } from '../data/preferenceOptions.js'
import { VOTE_VALUES } from '../data/feedbackOptions.js'

const feedbackVoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sectionType: {
      type: String,
      required: true,
      enum: CONTENT_SECTIONS,
    },
    contentId: {
      type: String,
      required: true,
    },
    vote: {
      type: String,
      required: true,
      enum: VOTE_VALUES,
    },
    // The day the opinion was formed, kept even though `createdAt` exists: an upsert
    // rewrites `updatedAt` and leaves `createdAt` pointing at the first vote, so neither
    // answers "which day's dashboard is this about" once someone changes their mind.
    votedOnDate: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    // Five scalar fields and no array, and `__v` only ever guards a concurrent array update — so
    // it was five bytes of nothing on every vote. See `User.js` for the mechanism. What protects
    // this document from a race is the unique index below, which is enforced by the database.
    versionKey: false,
  }
)

// The whole point of the voting feature: one person has one opinion per piece of content.
// Changing your mind updates this document; it never adds a second one. Enforced in the
// database rather than in the service, because a race between two clicks would defeat a
// check written in JavaScript.
//
// `userId` gets no index of its own: it is the leftmost key here, so a lookup of one person's
// votes already uses this one. A second index on it would be maintained on every write and
// answer nothing this cannot.
feedbackVoteSchema.index({ userId: 1, sectionType: 1, contentId: 1 }, { unique: true })

export const FeedbackVote = mongoose.model('FeedbackVote', feedbackVoteSchema)
