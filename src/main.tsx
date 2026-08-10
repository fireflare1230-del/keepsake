import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

/**
 * Self-hosted fonts (no CDN calls, NFR-12; offline, NFR-17).
 *
 * Two type systems on purpose (v2.1):
 *  - Newsreader + Literata carry the family-facing surfaces (landing,
 *    caretaker area). Both were drawn for long-form reading on screen,
 *    which gives Keepsake the feel of a well-set book rather than a
 *    dashboard.
 *  - Atkinson Hyperlegible stays inside the patient's visit flow. It
 *    was designed by the Braille Institute to keep letterforms
 *    distinguishable for low-vision readers, and that promise outranks
 *    style on the one screen a person with Alzheimer's actually uses.
 */
import '@fontsource/newsreader/400.css'
import '@fontsource/newsreader/500.css'
import '@fontsource/newsreader/600.css'
import '@fontsource/newsreader/400-italic.css'
import '@fontsource/newsreader/500-italic.css'
import '@fontsource/literata/400.css'
import '@fontsource/literata/500.css'
import '@fontsource/literata/600.css'
import '@fontsource/literata/400-italic.css'
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'

import './styles/index.css'
import { primeVoices } from './lib/speech'

// Ask the browser for its voice list immediately. Until that list
// exists, anything spoken plays in the system default voice (male on
// most Windows and Android devices), so Lane's greeting must never be
// the thing that triggers the load.
primeVoices()

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
