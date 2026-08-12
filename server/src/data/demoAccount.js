/**
 * The account behind the "Try the demo" button. A reviewer with five minutes should not
 * have to register and answer a quiz before seeing what this app does, so this account
 * arrives with the onboarding already answered.
 *
 * Its password is never used — `logInAsDemoUser` issues the session directly — but the
 * schema requires a hash, and a real one keeps the account from being a special case.
 */
export const DEMO_ACCOUNT = {
  email: 'demo@aicryptoadvisor.app',
  name: 'Demo Investor',
  preferences: {
    watchedAssets: [
      { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
      { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
      { id: 'solana', name: 'Solana', symbol: 'SOL' },
    ],
    investorType: 'hodler',
    contentSections: ['coin_prices', 'market_news', 'ai_insight', 'fun_meme'],
  },
}
