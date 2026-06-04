// Large, accessible emoji mood selector — 5 options, minimum 72px touch targets

interface Props {
  value: number | null;
  onChange: (mood: number) => void;
  disabled?: boolean;
}

const MOODS = [
  { value: 1, emoji: '😔', label: 'Not great' },
  { value: 2, emoji: '😕', label: 'A little low' },
  { value: 3, emoji: '😊', label: 'Okay' },
  { value: 4, emoji: '😄', label: 'Pretty good' },
  { value: 5, emoji: '😁', label: 'Wonderful!' },
]

export default function MoodPicker({ value, onChange, disabled }: Props) {
  return (
    <div className="flex gap-3 justify-center flex-wrap" role="radiogroup" aria-label="How are you feeling today?">
      {MOODS.map(m => (
        <button
          key={m.value}
          role="radio"
          aria-checked={value === m.value}
          aria-label={m.label}
          disabled={disabled}
          onClick={() => onChange(m.value)}
          className={[
            'flex flex-col items-center gap-1 rounded-2xl p-3 min-w-[72px] min-h-[72px]',
            'transition-all duration-150 cursor-pointer select-none',
            'border-2 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
            value === m.value
              ? 'border-brand bg-brand/10 scale-110 shadow-md'
              : 'border-transparent bg-white/70 hover:border-brand/30 hover:scale-105',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        >
          <span className="text-4xl leading-none">{m.emoji}</span>
          <span className="text-xs font-medium text-navy/70 text-center leading-tight">{m.label}</span>
        </button>
      ))}
    </div>
  )
}
