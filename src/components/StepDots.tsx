/** Little progress dots for the onboarding wizard. */
export default function StepDots({
  total,
  current,
}: {
  total: number
  current: number // zero-based
}) {
  return (
    <div
      className="flex items-center justify-center gap-2.5"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-label={`Step ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={
            'h-3 rounded-full transition-all duration-300 ' +
            (i === current
              ? 'w-8 bg-amber'
              : i < current
                ? 'w-3 bg-sage'
                : 'w-3 bg-cream-deep')
          }
        />
      ))}
    </div>
  )
}
