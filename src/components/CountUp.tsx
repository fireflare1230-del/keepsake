import { useEffect, useRef, useState } from 'react'

/**
 * A number that counts up when it appears (v1.4). Short and springy,
 * settles on the exact value. Skips straight to the value when the
 * user prefers reduced motion.
 */
export default function CountUp({
  value,
  duration = 900,
}: {
  value: number
  duration?: number
}) {
  const [shown, setShown] = useState(0)
  const raf = useRef<number>()

  useEffect(() => {
    if (
      value <= 0 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setShown(value)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(Math.round(eased * value))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [value, duration])

  return <>{shown}</>
}
