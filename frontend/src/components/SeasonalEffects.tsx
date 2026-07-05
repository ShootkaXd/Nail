import { useEffect, useRef } from 'react'
import type { Season } from '../hooks/useSeason'

// Falling particles per season: snow, petals, sun sparkles, autumn leaves
const GLYPHS: Record<Season, string[]> = {
  winter: ['❄', '❅', '•'],
  spring: ['🌸', '❀'],
  summer: ['✦', '✧', '•'],
  autumn: ['🍂', '🍁'],
}

const COLORS: Record<Season, string[]> = {
  winter: ['rgba(147,197,253,0.7)', 'rgba(255,255,255,0.9)', 'rgba(186,230,253,0.6)'],
  spring: ['rgba(244,114,182,0.55)', 'rgba(251,207,232,0.7)'],
  summer: ['rgba(251,191,36,0.45)', 'rgba(253,224,71,0.4)'],
  autumn: ['rgba(234,88,12,0.55)', 'rgba(217,119,6,0.5)'],
}

// Booking content is centered in a max-w-4xl (896px) column — keep particles
// confined to the side margins outside it so they never fly over the form.
const CONTENT_WIDTH = 896
const MIN_MARGIN = 90

interface Particle {
  x: number
  y: number
  size: number
  speedY: number
  driftX: number
  phase: number
  glyph: string
  color: string
  spin: number
  angle: number
  side: 'left' | 'right'
}

export default function SeasonalEffects({ season }: { season: Season }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Respect users who prefer reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)
    let margin = Math.max(0, (width - CONTENT_WIDTH) / 2)

    const glyphs = GLYPHS[season]
    const colors = COLORS[season]

    const randomXInBand = (side: 'left' | 'right') =>
      side === 'left' ? Math.random() * margin : width - Math.random() * margin

    const make = (spawnAnywhere: boolean): Particle => {
      const side: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right'
      return {
        x: randomXInBand(side),
        y: spawnAnywhere ? Math.random() * height : -20,
        size: 10 + Math.random() * 10,
        speedY: season === 'summer' ? 0.15 + Math.random() * 0.25 : 0.4 + Math.random() * 0.8,
        driftX: 0.3 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        spin: (Math.random() - 0.5) * 0.02,
        angle: Math.random() * Math.PI * 2,
        side,
      }
    }

    // Density scales with how much side margin is actually available
    const countForMargin = () => Math.round(Math.min(28, margin / 6))
    let particles: Particle[] = Array.from({ length: countForMargin() }, () => make(true))

    let raf = 0
    let t = 0

    const draw = () => {
      t += 0.01
      ctx.clearRect(0, 0, width, height)

      // No usable side margin (narrow/mobile viewport) — stay idle, don't cover content
      if (margin < MIN_MARGIN) {
        raf = requestAnimationFrame(draw)
        return
      }

      for (const p of particles) {
        p.y += p.speedY
        const drift = Math.sin(t + p.phase) * p.driftX
        p.x += drift
        p.angle += p.spin

        // Keep each particle confined to its own side band
        const bandMin = p.side === 'left' ? 0 : width - margin
        const bandMax = p.side === 'left' ? margin : width
        if (p.x < bandMin) p.x = bandMin
        if (p.x > bandMax) p.x = bandMax
        if (p.y > height + 24) Object.assign(p, make(false))

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.font = `${p.size}px serif`
        ctx.fillStyle = p.color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(p.glyph, 0, 0)
        ctx.restore()
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    const onResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      margin = Math.max(0, (width - CONTENT_WIDTH) / 2)
      particles = Array.from({ length: countForMargin() }, () => make(true))
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [season])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  )
}
