import { useCryptoMeme } from '../useDashboard.js'
import { DashboardSectionCard } from '../components/DashboardSectionCard.jsx'
import { FeedbackVoteButtons } from '../components/FeedbackVoteButtons.jsx'

const SECTION_TITLE = 'Meme of the day'

export const CryptoMemeSection = ({ className }) => {
  const meme = useCryptoMeme()

  return (
    <DashboardSectionCard
      className={className}
      title={SECTION_TITLE}
      sourceLabel={
        meme.data && (meme.data.isFallback ? 'Drawn for this app' : 'r/cryptocurrencymemes')
      }
      isPending={meme.isPending}
      error={meme.error}
      onRetry={meme.refetch}
      skeleton={<CryptoMemeSkeleton />}
      actions={
        meme.data ? (
          <FeedbackVoteButtons
            sectionType="fun_meme"
            contentId={meme.data.contentId}
            sectionLabel={SECTION_TITLE}
          />
        ) : null
      }
    >
      {meme.data ? (
        <figure className="max-w-xl">
          {/*
            A fixed frame with the image contained inside it, never cropped. These are drawn
            to one ratio today, but the frame is what keeps that from being an assumption —
            the card does not resize when the image arrives, and cropping a meme is how you
            cut off the caption that makes it one.

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
    <div className="skeleton aspect-[8/5] w-full rounded-lg" />
    <div className="skeleton mt-3 h-4 w-2/3" />
  </div>
)
