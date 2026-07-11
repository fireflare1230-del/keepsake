/**
 * The visit progress bar — quiet reassurance that the visit is moving
 * along, with no numbers or time pressure (NFR-6).
 */
export default function ProgressBar({
  current,
  total,
}: {
  current: number // zero-based step index
  total: number
}) {
  const percent = Math.round(((current + 1) / total) * 100)
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label="Visit progress"
      className="h-2.5 w-full overflow-hidden rounded-full bg-cream-deep"
    >
      <div
        className="h-full rounded-full bg-sage transition-all duration-700 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
