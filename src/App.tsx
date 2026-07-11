import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Landing from './routes/Landing'
import Onboarding from './routes/Onboarding'
import CheckIn from './routes/CheckIn'
import CaretakerArea from './routes/caretaker/CaretakerArea'

/**
 * Keepsake routes (HashRouter so the built site works from a plain
 * local file or any static host with zero server configuration):
 *
 *   #/            public landing page
 *   #/welcome     first-run onboarding wizard
 *   #/visit       the patient daily check-in (no login — FR-17)
 *   #/care/*      PIN-protected caretaker area
 */

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/welcome" element={<Onboarding />} />
        <Route path="/visit" element={<CheckIn />} />
        <Route path="/care/*" element={<CaretakerArea />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
