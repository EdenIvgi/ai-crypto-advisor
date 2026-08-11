import mongoose from 'mongoose'

/**
 * One generated insight, for one person, for one day.
 *
 * In the database rather than in memory, unlike the price and news caches, because this is the
 * only cached value whose loss costs something real: refetching prices is one free HTTP call,
 * while regenerating an insight spends a model call and — worse — hands the reader a different
 * paragraph than the one they read an hour ago. The free host restarts whenever nobody is
 * using it, so an in-memory cache here would miss most of the time.
 *
 * Deliberately minimal. The model that produced the text and the prompt it was given are not
 * stored, because nothing reads them: the section shows prose and the vote names the day.
 */
const dailyAiInsightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // The UTC date key, `YYYY-MM-DD`, matching `lib/dateKeys.js`. A string rather than a Date
    // because it is an identity, not an instant — comparing it never involves a time zone.
    insightDate: {
      type: String,
      required: true,
    },
    insightText: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    // Nothing here is an array, and `__v` only ever guards a concurrent array update, so the
    // field could never have done anything on this document. See `User.js` for the mechanism —
    // and note that unlike there, dropping it here cannot become wrong later.
    versionKey: false,
  }
)

// One model call per person per day, enforced by the database. Two dashboard loads racing on a
// cold cache would both find nothing and both generate; this is what stops the second from
// storing a second paragraph, and the service treats the resulting duplicate-key error as
// "somebody else just wrote today's".
//
// `userId` gets no index of its own: it is the leftmost key here, so this index already serves
// every query that filters on it, with or without a date.
dailyAiInsightSchema.index({ userId: 1, insightDate: 1 }, { unique: true })

export const DailyAiInsight = mongoose.model('DailyAiInsight', dailyAiInsightSchema)
