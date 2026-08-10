import { useState } from 'react'
import { DESIGNS, applyDesign, loadDesign, type DesignPack } from '../lib/design'

/**
 * The design pack switcher (v1.5). `floating` is the little pill on the
 * landing page for instant try-it-live comparison; `inline` is the full
 * card row in Settings → Appearance. Both apply instantly and persist.
 */
export default function DesignPicker({
  variant,
}: {
  variant: 'floating' | 'inline'
}) {
  const [active, setActive] = useState<DesignPack['id']>(() => loadDesign())

  function choose(id: DesignPack['id']) {
    applyDesign(id)
    setActive(id)
  }

  if (variant === 'floating') {
    return (
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-cream-deep bg-[#FFFDF9]/95 px-4 py-2.5 shadow-lift backdrop-blur">
        <span className="text-sm font-bold uppercase tracking-wider text-ink-faint">
          Design
        </span>
        {DESIGNS.map((design) => (
          <button
            key={design.id}
            onClick={() => choose(design.id)}
            aria-label={`Switch to the ${design.name} design`}
            aria-pressed={active === design.id}
            title={`${design.name}: ${design.tagline}`}
            className={
              'h-9 w-9 rounded-full transition-all duration-200 ease-spring ' +
              (active === design.id
                ? 'scale-110 ring-2 ring-ink ring-offset-2'
                : 'opacity-80 hover:scale-105 hover:opacity-100')
            }
            style={{
              background: `conic-gradient(${design.swatch[0]} 0 40%, ${design.swatch[1]} 40% 75%, ${design.swatch[2]} 75% 100%)`,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {DESIGNS.map((design) => (
        <button
          key={design.id}
          onClick={() => choose(design.id)}
          aria-pressed={active === design.id}
          className={
            'rounded-xl border-2 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ' +
            (active === design.id
              ? 'border-ink bg-[#FFFDF9] shadow-lift'
              : 'border-cream-deep bg-[#FFFDF9]/70 hover:shadow-card')
          }
        >
          <span className="flex gap-1.5" aria-hidden="true">
            {design.swatch.map((color) => (
              <span
                key={color}
                className="h-7 w-7 rounded-full border border-black/10"
                style={{ background: color }}
              />
            ))}
          </span>
          <span className="mt-3 block text-lg font-bold">
            {design.name}
            {active === design.id && ' ✓'}
          </span>
          <span className="mt-0.5 block text-base text-ink-muted">
            {design.tagline}
          </span>
        </button>
      ))}
    </div>
  )
}
