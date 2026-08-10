import mongoose from 'mongoose'

import { INVESTOR_TYPES, CONTENT_SECTIONS } from '../data/preferenceOptions.js'

/**
 * Quiz answers. Embedded rather than a separate collection: it is one-to-one with the user,
 * always read together with them, and small. A separate collection would only add a lookup.
 *
 * `_id: false` because these are a property of the user, not a document in their own right.
 */
const userPreferencesSchema = new mongoose.Schema(
  {
    watchedAssetIds: {
      type: [String],
      required: true,
      validate: {
        validator: (assetIds) => assetIds.length > 0,
        message: 'Pick at least one asset to follow',
      },
    },
    investorType: {
      type: String,
      required: true,
      enum: INVESTOR_TYPES,
    },
    contentSections: {
      type: [String],
      required: true,
      enum: CONTENT_SECTIONS,
      validate: {
        validator: (sections) => sections.length > 0,
        message: 'Pick at least one kind of content',
      },
    },
  },
  { _id: false }
)

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Never returned by a query unless explicitly selected, so no route can leak it by
    // forgetting to strip it.
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    // Absent until the quiz is completed. That absence is what `hasCompletedOnboarding`
    // reports and what `requireOnboarding` checks — there is no separate flag to keep in sync.
    preferences: {
      type: userPreferencesSchema,
      required: false,
    },
  },
  { timestamps: true }
)

export const User = mongoose.model('User', userSchema)
