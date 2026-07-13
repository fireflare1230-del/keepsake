import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { useId } from 'react'

/**
 * Labeled form controls with hints, every input in the app gets a real
 * <label> tied to it (NFR-4) and comfortable 48px-tall targets.
 */

const inputClasses =
  'w-full rounded-lg border border-cream-deep bg-[#FFFDF9] px-4 py-3 text-base text-ink placeholder:text-ink-faint/70 min-h-[48px]'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  optional?: boolean
}

export function Field({ label, hint, optional, className = '', ...rest }: FieldProps) {
  const id = useId()
  const hintId = hint ? id + '-hint' : undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-semibold text-ink">
        {label}
        {optional && (
          <span className="ml-2 text-base font-normal text-ink-faint">optional</span>
        )}
      </label>
      <input id={id} aria-describedby={hintId} className={inputClasses} {...rest} />
      {hint && (
        <p id={hintId} className="mt-1.5 text-base text-ink-faint">
          {hint}
        </p>
      )}
    </div>
  )
}

interface AreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
  optional?: boolean
}

export function TextArea({ label, hint, optional, className = '', ...rest }: AreaProps) {
  const id = useId()
  const hintId = hint ? id + '-hint' : undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-semibold text-ink">
        {label}
        {optional && (
          <span className="ml-2 text-base font-normal text-ink-faint">optional</span>
        )}
      </label>
      <textarea
        id={id}
        aria-describedby={hintId}
        rows={4}
        className={inputClasses + ' resize-y'}
        {...rest}
      />
      {hint && (
        <p id={hintId} className="mt-1.5 text-base text-ink-faint">
          {hint}
        </p>
      )}
    </div>
  )
}
