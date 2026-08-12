import mongoose from 'mongoose'

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
