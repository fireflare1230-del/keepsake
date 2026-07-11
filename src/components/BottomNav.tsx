import { useNavigate, useLocation } from 'react-router-dom'
import { getProfiles } from '../lib/storage'

interface Props {
  profileId?: string
}

export default function BottomNav({ profileId }: Props) {
  const navigate  = useNavigate()
  const { pathname } = useLocation()
  const fallbackId = profileId ?? getProfiles()[0]?.id ?? ''

  const tabs = [
    {
      label:   'Checkup',
      icon:    '🏠',
      active:  pathname.startsWith('/checkin') || pathname === '/',
      onClick: () => fallbackId ? navigate(`/checkin/${fallbackId}`) : navigate('/'),
    },
    {
      label:   'History',
      icon:    '📋',
      active:  pathname.startsWith('/caretaker/visits'),
      onClick: () => navigate(fallbackId ? `/caretaker/visits/${fallbackId}` : '/caretaker'),
    },
    {
      label:   'Settings',
      icon:    '⚙️',
      active:  pathname.startsWith('/caretaker') && !pathname.startsWith('/caretaker/visits'),
      onClick: () => navigate('/caretaker'),
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/8 z-50 flex h-16">
      {tabs.map(t => (
        <button
          key={t.label}
          onClick={t.onClick}
          className={[
            'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
            t.active ? 'text-primary' : 'text-navy/35',
          ].join(' ')}
        >
          <span className="text-2xl leading-none">{t.icon}</span>
          <span className={`text-[11px] font-semibold tracking-wide ${t.active ? 'text-primary' : 'text-navy/40'}`}>
            {t.label}
          </span>
        </button>
      ))}
    </nav>
  )
}
