/**
 * The two things a vote can be. Kept beside the other option lists rather than inside the
 * model so the Mongoose enum, the Zod schema on the route, and the client all agree by
 * importing the same array instead of each spelling the strings out.
 */
export const VOTE_VALUES = ['up', 'down']
