import { useId, useState } from 'react'
import Button from './Button'

/**
 * A friendly editor for short lists ("topics to gently avoid",
 * "gentle facts to reinforce"): type, add, remove.
 */
export default function ChipListEditor({
  label,
  hint,
  placeholder,
  values,
  onChange,
  tone = 'sage',
}: {
  label: string
  hint?: string
  placeholder?: string
  values: string[]
  onChange: (next: string[]) => void
  tone?: 'sage' | 'rust'
}) {
  const id = useId()
  const [draft, setDraft] = useState('')

  function add() {
    const text = draft.trim()
    if (!text) return
    if (!values.includes(text)) onChange([...values, text])
    setDraft('')
  }

  const chipClasses =
    tone === 'rust'
      ? 'bg-rust-wash text-rust-deep border border-rust/30'
      : 'bg-sage-wash text-sage-deep border border-sage/40'

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-semibold text-ink">
        {label}
      </label>
      {hint && <p className="mb-2 text-base text-ink-faint">{hint}</p>}
      <div className="flex gap-2">
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
          className="min-h-[48px] w-full rounded-lg border border-cream-deep bg-[#FFFDF9] px-4 py-3 text-base"
        />
        <Button type="button" variant="secondary" onClick={add}>
          Add
        </Button>
      </div>
      {values.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={label}>
          {values.map((value) => (
            <li
              key={value}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-base font-medium ${chipClasses}`}
            >
              {value}
              <button
                type="button"
                onClick={() => onChange(values.filter((v) => v !== value))}
                aria-label={`Remove "${value}"`}
                className="text-lg leading-none opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
