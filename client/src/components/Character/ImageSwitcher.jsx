import { useState, useRef, useCallback, useEffect } from 'react'
import { IMAGE_LABELS } from '../../constants/ui.constants'

export default function ImageSwitcher({ images }) {
  const [active, setActive] = useState(0)
  const [fading, setFading] = useState(false)
  const timerRef = useRef(null)

  const switchTo = useCallback(
    (idx) => {
      if (idx === active || fading) return
      setFading(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setActive(idx)
        setFading(false)
      }, 260)
    },
    [active, fading]
  )

  useEffect(() => () => clearTimeout(timerRef.current), [])

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-xl border border-solid border-[rgba(180,140,255,0.12)] bg-[rgba(255,255,255,0.03)]">
        <span className="text-5xl text-[rgba(240,232,255,0.18)]">✦</span>
      </div>
    )
  }

  const single = images.length === 1

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-solid border-[rgba(180,140,255,0.12)] bg-[rgba(10,8,28,0.8)]">
        <div className="pointer-events-none absolute left-2 top-2 z-[3] h-[18px] w-[18px] border-l-[1.5px] border-t-[1.5px] border-solid border-[#e8c97a]" />
        <div className="pointer-events-none absolute right-2 top-2 z-[3] h-[18px] w-[18px] border-r-[1.5px] border-t-[1.5px] border-solid border-[#e8c97a]" />
        <div className="pointer-events-none absolute bottom-2 left-2 z-[3] h-[18px] w-[18px] border-b-[1.5px] border-l-[1.5px] border-solid border-[#e8c97a]" />
        <div className="pointer-events-none absolute bottom-2 right-2 z-[3] h-[18px] w-[18px] border-b-[1.5px] border-r-[1.5px] border-solid border-[#e8c97a]" />
        <img
          key={active}
          src={images[active].url}
          alt={`character view ${active + 1}`}
          className={`block h-full w-full object-cover object-[top_center] ${
            fading
              ? 'motion-safe:animate-character-image-fade-out motion-reduce:animate-none'
              : 'motion-safe:animate-character-image-fade-in motion-reduce:animate-none'
          }`}
        />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[2] h-[35%] bg-[linear-gradient(to_top,rgba(5,4,15,0.75),transparent)]" />
      </div>

      {!single && (
        <div className="flex flex-wrap gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              className={`relative min-w-[72px] flex-1 cursor-pointer overflow-hidden rounded-md border border-solid px-[10px] py-2 [transition:border-color_0.22s,background_0.22s] max-[480px]:min-w-[56px] max-[480px]:px-2 max-[480px]:py-[6px] border-[rgba(180,140,255,0.12)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(192,132,252,0.35)] hover:bg-[rgba(255,255,255,0.055)] ${
                i === active
                  ? 'border-[#c084fc] bg-[rgba(192,132,252,0.1)]'
                  : ''
              }`}
              onClick={() => switchTo(i)}
              aria-label={IMAGE_LABELS[i] ?? `View ${i + 1}`}
            >
              <span
                className={`relative z-[1] block whitespace-nowrap text-center font-['Inter',sans-serif] text-[9px] uppercase tracking-[0.18em] transition-colors duration-[220ms] max-[480px]:text-[8px] max-[480px]:tracking-[0.12em] ${
                  i === active
                    ? 'text-[#c084fc]'
                    : 'text-[rgba(240,232,255,0.35)]'
                }`}
              >
                {IMAGE_LABELS[i] ?? `View ${i + 1}`}
              </span>
              <span
                className={`absolute inset-0 bg-[linear-gradient(105deg,transparent_30%,rgba(192,132,252,0.18)_50%,transparent_70%)] bg-[length:200%_100%] transition-opacity duration-300 ${
                  i === active
                    ? 'opacity-100 motion-safe:animate-character-switch-glow motion-reduce:animate-none'
                    : 'opacity-0'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
