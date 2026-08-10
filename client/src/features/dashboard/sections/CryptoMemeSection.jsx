import { useCryptoMeme } from '../useDashboard.js'
import { DashboardSectionCard } from '../components/DashboardSectionCard.jsx'

export const CryptoMemeSection = ({ className }) => {
  const meme = useCryptoMeme()

  return (
    <DashboardSectionCard
      className={className}
      title="Meme of the day"
      sourceLabel={
        meme.data && (meme.data.isFallback ? 'Sample meme' : 'r/cryptocurrencymemes')
      }
      isPending={meme.isPending}
      error={meme.error}
      onRetry={meme.refetch}
      skeleton={<CryptoMemeSkeleton />}
    >
      {meme.data ? (
        // Capped rather than filling the card: when the insight is not selected this card
        // has a whole row to itself, and a meme blown up to eleven hundred pixels is a
        // worse joke than the same meme at a readable size.
        <figure className="max-w-xl">
          {/*
            A fixed frame with the image contained inside it, never cropped: from M10 these
            are arbitrary Reddit uploads whose proportions nobody controls, and cropping a
            meme is how you cut off the caption that makes it one. The frame's own ratio
            keeps the card from resizing when the image arrives.

            The alt text is the caption because the caption is the joke — describing the
            picture instead would leave a screen reader with the setup and no punchline.
          */}
          <div className="flex aspect-[8/5] items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
            <img
              src={meme.data.meme.imageUrl}
              alt={meme.data.meme.title}
              loading="lazy"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <figcaption className="mt-3 flex items-baseline justify-between gap-4">
            <span className="text-sm text-pretty">{meme.data.meme.title}</span>
            <a
              href={meme.data.meme.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="data-label shrink-0 transition-colors hover:text-foreground"
            >
              Source
            </a>
          </figcaption>
        </figure>
      ) : null}
    </DashboardSectionCard>
  )
}

const CryptoMemeSkeleton = () => (
  <div className="max-w-xl">
    <div className="aspect-[8/5] w-full animate-pulse rounded-lg bg-muted" />
    <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-muted" />
  </div>
)
