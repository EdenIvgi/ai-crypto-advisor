import mongoose from 'mongoose'

import { INVESTOR_TYPES, CONTENT_SECTIONS } from '../data/preferenceOptions.js'

const watchedAssetSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    symbol: { type: String, required: true },
  },
  { _id: false }
)

const userPreferencesSchema = new mongoose.Schema(
  {
    watchedAssets: {
      type: [watchedAssetSchema],
      required: true,
      validate: {
        validator: (assets) => assets.length > 0,
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
  {
    timestamps: true,
    // Mongoose's `__v` guards two concurrent array updates from clobbering each other, and it
    // only ever moves through `save()`. Preferences are replaced whole by `findByIdAndUpdate`,
    // so it was written once at registration and stayed at 0 for the life of every document —
    // a field on the user that said nothing about the user. `updatedAt` answers what it looked
    // like it answered.
    //
    // Put it back if anything here starts loading a user, mutating `preferences.watchedAssets`
    // in place and saving it: without the version key, two of those racing lose an update
    // silently instead of raising a `VersionError`.
    versionKey: false,
  }
)

export const User = mongoose.model('User', userSchema)
