import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initVoice } from './lib/ai'

// Start loading the best available TTS voice immediately on page load
initVoice()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
