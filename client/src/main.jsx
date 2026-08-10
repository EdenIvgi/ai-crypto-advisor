import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'

// Bundled rather than loaded from a font CDN: no third-party request on first paint, and
// the app keeps its typography offline and behind a strict content policy.
import '@fontsource-variable/ibm-plex-sans'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'

import { App } from './App.jsx'
import { queryClient } from './lib/queryClient.js'
import { wakeApi } from './lib/wakeApi.js'
import './index.css'

wakeApi()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
