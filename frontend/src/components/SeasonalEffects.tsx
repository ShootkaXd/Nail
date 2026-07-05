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

    const isMobile = width < 640
    const COUNT = isMobile ? 14 : 28

    const glyphs = GLYPHS[season]
    const colors = COLORS[season]

    const make = (spawnAnywhere: boolean): Particle => ({
      x: Math.random() * width,
      y: spawnAnywhere ? Math.random() * height : -20,
      size: 10 + Math.random() * 10,
      speedY: season === 'summer' ? 0.15 + Math.random() * 0.25 : 0.4 + Math.random() * 0.8,
      driftX: 0.3 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      spin: (Math.random() - 0.5) * 0.02,
      angle: Math.random() * Math.PI * 2,
    })

    const particles: Particle[] = Array.from({ length: COUNT }, () => make(true))

    let raf = 0
    let t = 0

    const draw = () => {
      t += 0.01
      ctx.clearRect(0, 0, width, height)
      for (const p of particles) {
        p.y += p.speedY
        p.x += Math.sin(t + p.phase) * p.driftX
        p.angle += p.spin
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
      className="fixed inset-0 pointer-events-none z-30"
      aria-hidden="true"
    />
  )
}
