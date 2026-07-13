/** The Keepsake mark, an amber tile holding a cream heart. */

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="2" width="60" height="60" rx="14" fill="#E8A04C" />
      <path
        d="M32 47.5C31 46.7 16 36.6 16 26.8 16 21.4 20.2 17 25.4 17c2.7 0 5.2 1.2 6.6 3.2C33.4 18.2 35.9 17 38.6 17 43.8 17 48 21.4 48 26.8c0 9.8-15 19.9-16 20.7z"
        fill="#FAF6F0"
      />
      <circle cx="45" cy="15.5" r="3" fill="#FAF6F0" opacity="0.85" />
    </svg>
  )
}

export function LogoLockup({ size = 36 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-3">
      <LogoMark size={size} />
      <span
        className="font-display font-bold tracking-tight text-ink"
        style={{ fontSize: size * 0.66 }}
      >
        Keepsake
      </span>
    </span>
  )
}
