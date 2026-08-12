import { z } from 'zod'

const MEME_API_URL = 'https://meme-api.com/gimme/cryptocurrencymemes'
const REQUEST_TIMEOUT_MS = 8000
const BATCH_SIZE = 25
const IMAGE_URL_PATTERN = /\.(png|jpe?g|gif|webp)$/i

const memeSchema = z.object({
  postLink: z.string(),
  title: z.string(),
  url: z.string(),
  nsfw: z.boolean(),
  spoiler: z.boolean(),
})

const batchResponseSchema = z.object({
  memes: z.array(memeSchema),
})

export const fetchCryptoMemes = async () => {
  const response = await fetch(`${MEME_API_URL}/${BATCH_SIZE}`, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`The meme API answered ${response.status}`)
  }

  const { memes } = batchResponseSchema.parse(await response.json())

  const usable = memes.filter(isShowable).map(toMemeDto)

  if (usable.length === 0) {
    throw new Error('The meme API returned nothing showable')
  }

  return usable
}

// The flags are whatever the poster and the subreddit's moderators marked, so they catch the
// declared cases and nothing else. The extension test is the one that does real work: a Reddit
// gallery or video post answers with a link this card cannot render.
const isShowable = (meme) =>
  !meme.nsfw && !meme.spoiler && IMAGE_URL_PATTERN.test(new URL(meme.url).pathname)

const toMemeDto = (meme) => ({
  id: meme.postLink.split('/').filter(Boolean).pop(),
  title: meme.title,
  imageUrl: meme.url,
  sourceUrl: meme.postLink,
})
