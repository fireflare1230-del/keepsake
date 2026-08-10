/**
 * Design packs (v1.5): three complete looks for Keepsake, switchable
 * live. Each pack re-skins the whole app through `[data-design]` CSS
 * overrides in styles/index.css; components never change. The choice
 * persists per device.
 *
 *   hearth  (default) warm cream, amber and dusty blue, the original
 *   dusk    quiet evening, mauve-gray light, plum and soft gold
 *   meadow  fresh morning, pale green light, evergreen and terracotta
 */

export interface DesignPack {
  id: 'hearth' | 'dusk' | 'meadow'
  name: string
  tagline: string
  /** Swatch colors for the picker: [background, primary, accent]. */
  swatch: [string, string, string]
}

export const DESIGNS: DesignPack[] = [
  {
    id: 'hearth',
    name: 'Hearth',
    tagline: 'Warm cream and amber, the original',
    swatch: ['#FAF6F0', '#E8A04C', '#5E93AC'],
  },
  {
    id: 'dusk',
    name: 'Dusk',
    tagline: 'Quiet evening, plum and soft gold',
    swatch: ['#F6F2F7', '#D9A441', '#8A6B9A'],
  },
  {
    id: 'meadow',
    name: 'Meadow',
    tagline: 'Fresh morning, evergreen and terracotta',
    swatch: ['#F4F7F1', '#D07850', '#4E7D5B'],
  },
]

const KEY = 'keepsake:design'

export function loadDesign(): DesignPack['id'] {
  try {
    const stored = localStorage.getItem(KEY)
    if (stored && DESIGNS.some((d) => d.id === stored)) {
      return stored as DesignPack['id']
    }
  } catch {
    /* ignore */
  }
  return 'hearth'
}

export function applyDesign(id: DesignPack['id']): void {
  try {
    localStorage.setItem(KEY, id)
  } catch {
    /* ignore */
  }
  if (id === 'hearth') {
    delete document.documentElement.dataset.design
  } else {
    document.documentElement.dataset.design = id
  }
}

/** Called once at boot, before first paint matters. */
export function bootDesign(): void {
  applyDesign(loadDesign())
}
