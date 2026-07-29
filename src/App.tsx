import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import Landing from './routes/Landing'
import Onboarding from './routes/Onboarding'
import CheckIn from './routes/CheckIn'

// The caretaker area (and its chart library) loads lazily so the
// patient-facing visit stays light and fast on a modest tablet (NFR-16).
const CaretakerArea = lazy(() => import('./routes/caretaker/CaretakerArea'))

/**
 * Keepsake routes (HashRouter so the built site works from a plain
 * local file or any static host with zero server configuration):
 *
 *   #/            public landing page
 *   #/welcome     first-run onboarding wizard
 *   #/visit       the patient daily check-in (no login, FR-17)
 *   #/care/*      PIN-protected caretaker area
 */

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/** Real apps name their tabs; the title follows the route. */
function PageTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = pathname.startsWith('/care')
      ? 'Caretaker area · Keepsake'
      : pathname.startsWith('/visit')
        ? "Today's visit · Keepsake"
        : pathname.startsWith('/welcome')
          ? 'Getting started · Keepsake'
          : 'Keepsake · A gentle daily visit'
  }, [pathname])
  return null
}

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <PageTitle />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/welcome" element={<Onboarding />} />
        <Route path="/visit" element={<CheckIn />} />
        <Route
          path="/care/*"
          element={
            <Suspense
              fallback={
                <main className="flex min-h-screen items-center justify-center text-ink-faint">
                  Opening the caretaker area…
                </main>
              }
            >
              <CaretakerArea />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
