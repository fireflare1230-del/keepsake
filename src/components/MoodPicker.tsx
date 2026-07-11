/**
 * The mood check-in — five big faces, any answer is a win (FR-14).
 * Emoji plus a word, never color alone (NFR-2).
 */

const MOODS = [
  { value: 1, emoji: '😞', label: 'Not so good' },
  { value: 2, emoji: '😕', label: 'A little low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Wonderful' },
]

export default function MoodPicker({
  onPick,
}: {
  onPick: (mood: number) => void
}) {
  return (
    <div
      role="group"
      aria-label="How are you feeling today?"
      className="grid grid-cols-2 gap-4 sm:grid-cols-5"
    >
      {MOODS.map((mood) => (
        <button
          key={mood.value}
          onClick={() => onPick(mood.value)}
          className="flex min-h-[112px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-cream-deep bg-[#FFFDF9] p-4 shadow-card transition-all hover:border-brand hover:bg-brand-wash active:shadow-press"
        >
          <span aria-hidden="true" className="text-5xl leading-none">
            {mood.emoji}
          </span>
          <span className="text-lg font-semibold text-ink">{mood.label}</span>
        </button>
      ))}
    </div>
  )
}
