// 2×2 mood grid — matches the ReMind design language

interface Props {
  value: number | null
  onChange: (mood: number) => void
  disabled?: boolean
}

const MOODS = [
  { value: 5, emoji: '😊', label: 'Happy' },
  { value: 4, emoji: '😌', label: 'Calm' },
  { value: 2, emoji: '😴', label: 'Tired' },
  { value: 1, emoji: '😟', label: 'Worried' },
]

export default function MoodPicker({ value, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="How are you feeling today?">
      {MOODS.map(m => (
        <button
          key={m.value}
          role="radio"
          aria-checked={value === m.value}
          aria-label={m.label}
          disabled={disabled}
          onClick={() => onChange(m.value)}
          className={[
            'bg-white rounded-2xl p-5 flex flex-col items-center gap-2 shadow-sm',
            'border-2 transition-all duration-150 active:scale-95 cursor-pointer',
            'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            value === m.value
              ? 'border-primary bg-primary/5 shadow-md scale-[1.03]'
              : 'border-transparent hover:border-primary/30',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        >
          <span className="text-5xl leading-none">{m.emoji}</span>
          <span className="text-base font-semibold text-navy">{m.label}</span>
        </button>
      ))}
    </div>
  )
}
