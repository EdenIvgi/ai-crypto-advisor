import { Link } from 'react-router-dom'

const MARKET_TICKER_ROWS = [
  { symbol: 'BTC', label: 'Bitcoin' },
  { symbol: 'ETH', label: 'Ethereum' },
  { symbol: 'SOL', label: 'Solana' },
  { symbol: 'ADA', label: 'Cardano' },
]

export const AuthLayout = ({ eyebrow, title, description, children, footer }) => (
  <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
    <IntroductionPanel />

    <main className="flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="mb-10 inline-flex items-center gap-2 text-lg font-semibold tracking-tight lg:hidden"
        >
          <ProductMark />
        </Link>

        <div className="mb-8 space-y-2">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {children}

        {footer ? <div className="mt-8 text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    </main>
  </div>
)

const ProductMark = () => (
  <span className="flex items-baseline gap-1.5">
    <span className="font-mono text-xs font-medium tracking-[0.2em] text-primary uppercase">
      AI
    </span>
    <span className="font-semibold tracking-tight">Crypto Advisor</span>
  </span>
)

const IntroductionPanel = () => (
  <aside className="relative hidden overflow-hidden border-r border-border bg-secondary/40 lg:flex lg:flex-col lg:justify-between lg:p-12">
    <Link to="/" className="inline-flex text-lg">
      <ProductMark />
    </Link>

    <div className="max-w-md space-y-6">
      <h2 className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance">
        The market, filtered down to what you actually follow.
      </h2>
      <p className="text-base leading-relaxed text-muted-foreground">
        Answer three questions about how you invest. Every morning after that, you get prices
        for your assets, headlines that matter to them, an insight written for your strategy,
        and one meme.
      </p>
    </div>

    <dl className="space-y-px" aria-hidden="true">
      <p className="eyebrow mb-4">Your watchlist, once you set it</p>
      {MARKET_TICKER_ROWS.map(({ symbol, label }) => (
        <div
          key={symbol}
          className="flex items-baseline justify-between border-b border-border/60 py-2.5 font-mono text-sm"
        >
          <dt className="flex items-baseline gap-3">
            <span className="w-9 font-medium">{symbol}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </dt>
          <dd className="text-muted-foreground/50">- - - -</dd>
        </div>
      ))}
    </dl>
  </aside>
)
