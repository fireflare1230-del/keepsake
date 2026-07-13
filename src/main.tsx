import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Self-hosted fonts (no CDN calls, NFR-12; offline, NFR-17).
// Fraunces: warm storybook serif for headings.
// Atkinson Hyperlegible: body font designed by the Braille Institute
// for maximum legibility for low-vision readers.
import '@fontsource/fraunces/500.css'
import '@fontsource/fraunces/600.css'
import '@fontsource/fraunces/700.css'
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'

import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Register the service worker so Keepsake can be pinned to a tablet
// home screen and opened offline. Service workers only exist on
// https:// or localhost, when the app is opened as a plain local file
// (file://) we quietly skip this; the app still works.
if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* not fatal, the app runs fine without offline caching */
    })
  })
}
