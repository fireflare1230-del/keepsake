import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'brand' | 'ghost' | 'danger'
type Size = 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

/**
 * Every button in Keepsake is at least 48px tall (NFR-1) with a calm,
 * obvious pressed state. `xl` is for the patient-facing screens where
 * targets should be even more generous.
 */
const variantClasses: Record<Variant, string> = {
  primary:
    'bg-amber text-ink font-semibold shadow-card hover:brightness-105 active:shadow-press',
  secondary:
    'bg-sage-wash text-sage-deep font-semibold border border-sage/50 hover:bg-sage/25 active:shadow-press',
  brand:
    'bg-brand-deep text-cream font-semibold shadow-card hover:bg-brand-deeper active:shadow-press',
  ghost:
    'bg-transparent text-brand-deep font-semibold hover:bg-brand-wash active:shadow-press',
  danger:
    'bg-rust-wash text-rust-deep font-semibold border border-rust/40 hover:bg-rust/20 active:shadow-press',
}

const sizeClasses: Record<Size, string> = {
  md: 'min-h-[48px] px-6 text-base rounded-lg',
  lg: 'min-h-[56px] px-8 text-lg rounded-xl',
  xl: 'min-h-[64px] px-8 text-xl rounded-xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition-all duration-150 hover:-translate-y-px active:translate-y-0 active:scale-[0.985] disabled:opacity-45 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
