import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import PatientCheckin from './pages/PatientCheckin'
import CaretakerArea from './pages/caretaker/CaretakerArea'
import Dashboard from './pages/caretaker/Dashboard'
import ProfileEditor from './pages/caretaker/ProfileEditor'
import VisitLog from './pages/caretaker/VisitLog'
import Settings from './pages/caretaker/Settings'

// HashRouter is used so the app works both as a local file (file://) and on
// any static host (GitHub Pages, Netlify, Vercel) without server-side routing.

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Public landing */}
        <Route path="/" element={<Landing />} />

        {/* First-run wizard */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Patient daily check-in — no login required */}
        <Route path="/checkin/:profileId" element={<PatientCheckin />} />

        {/* Caretaker area — PIN-protected layout wrapper */}
        <Route path="/caretaker" element={<CaretakerArea />}>
          <Route index element={<Dashboard />} />
          <Route path="profile/new" element={<ProfileEditor />} />
          <Route path="profile/:id" element={<ProfileEditor />} />
          <Route path="visits/:profileId" element={<VisitLog />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
