import mongoose from 'mongoose'

const memeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    sourceUrl: { type: String, required: true },
  },
  { _id: false }
)

const dailyMemeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // The UTC date key, `YYYY-MM-DD`, matching `lib/dateKeys.js`. A string rather than a Date
    // because it is an identity, not an instant — comparing it never involves a time zone.
    memeDate: {
      type: String,
      required: true,
    },
    meme: {
      type: memeSchema,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

// One meme per person per day, enforced by the database rather than by the service. The source
// returns a different batch on every call, so without this the meme would change on any cache miss
// — and on a free instance that sleeps, a miss is the ordinary case. Two dashboard loads racing on
// a cold start both find nothing and both choose; the index lets one win and the service treats
// the duplicate-key error as "this reader's meme was already picked".
//
// `userId` gets no index of its own: it is the leftmost key here, so this index already serves
// every query that filters on it, with or without a date.
dailyMemeSchema.index({ userId: 1, memeDate: 1 }, { unique: true })

export const DailyMeme = mongoose.model('DailyMeme', dailyMemeSchema)
