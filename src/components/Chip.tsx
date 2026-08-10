import type { ReactNode } from 'react'

/**
 * A big, tap-able answer chip (FR-15). Structured choice instead of a
 * blank box, there is nothing to get wrong (Montessori / errorless).
 *
 * v2.0: chips are little paper slips laid on the album page, square
 * corners, a hand-pressed shadow, and a whisper of rotation so no two
 * sit perfectly straight. Type stays Atkinson for readability.
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
      className="min-h-[60px] rounded-md border-2 border-[#A06B3A]/60 bg-[#FFFDF6] px-7 py-3 text-xl font-semibold text-ink shadow-[2px_3px_0_rgba(160,107,58,0.3)] transition-all duration-150 odd:rotate-[-0.6deg] even:rotate-[0.7deg] hover:rotate-0 hover:border-[#A06B3A] hover:bg-[#F5ECD9] active:scale-[0.985] active:shadow-press disabled:opacity-45"
    >
      {children}
    </button>
  )
}
