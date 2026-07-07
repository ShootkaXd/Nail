import { useEffect, useRef } from 'react'

interface Particle {
  x: number; y: number; vx: number; vy: number
  size: number; color: string; rotation: number; vr: number
  life: number
}

const COLORS = ['#f472b6', '#facc15', '#60a5fa', '#34d399', '#fb923c']

// A one-shot celebratory burst from the center — plays for ~1.4s then stops.
// Purely decorative; skipped entirely for prefers-reduced-motion.
export default function ConfettiBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = (canvas.width = window.innerWidth)
    const height = (canvas.height = window.innerHeight)
    const cx = width / 2
    const cy = height * 0.3

    const particles: Particle[] = Array.from({ length: 60 }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 5
      return {
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 4 + Math.random() * 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        life: 1,
      }
    })

    let raf = 0
    const gravity = 0.12

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      let alive = false
      for (const p of particles) {
        if (p.life <= 0) continue
        p.vy += gravity
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.vr
        p.life -= 0.012
        if (p.life > 0) alive = true

        ctx.save()
        ctx.globalAlpha = Math.max(p.life, 0)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      }
      if (alive) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-40" aria-hidden="true" />
}
