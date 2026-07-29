import type { ReactNode } from 'react'

/**
 * A big, tap-able answer chip (FR-15). Structured choice instead of a
 * blank box, there is nothing to get wrong (Montessori / errorless).
 */
export default function Chip({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="min-h-[60px] rounded-full border-2 border-brand/40 bg-[#FFFDF9] px-7 py-3 text-xl font-semibold text-ink shadow-card transition-all duration-150 hover:-translate-y-px hover:border-brand hover:bg-brand-wash active:translate-y-0 active:scale-[0.985] active:shadow-press disabled:opacity-45"
    >
      {children}
    </button>
  )
}
