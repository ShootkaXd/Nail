// Generates a Tailwind-style 50–900 shade ramp from a single admin-picked
// hex color, by shifting HSL lightness around it (shade 500 = the exact
// picked color) — mirrors how the previous hardcoded "rose" palette worked.

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  const d = max - min
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case r: h = ((g - b) / d) % 6; break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h *= 60
    if (h < 0) h += 360
  }
  return [h, s * 100, l * 100]
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

// Lightness delta applied to the base color's lightness for each shade step
const DELTAS: Record<string, number> = {
  '50': 44, '100': 38, '200': 28, '300': 19, '400': 9,
  '500': 0, '600': -8, '700': -16, '800': -22, '900': -28,
}

export function generateShades(baseHex: string): Record<string, string> {
  const [h, s, l] = hexToHsl(baseHex)
  const shades: Record<string, string> = {}
  for (const [step, delta] of Object.entries(DELTAS)) {
    shades[step] = step === '500' ? baseHex : hslToHex(h, s, clamp(l + delta, 4, 97))
  }
  return shades
}
