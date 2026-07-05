interface Props {
  name: string
  url?: string | null
  size?: number
  className?: string
}

// Master avatar: shows their uploaded photo if set, otherwise a soft
// initial-letter circle in the current brand color — no emoji fallback.
export default function Avatar({ name, url, size = 48, className = '' }: Props) {
  const style = { width: size, height: size }

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={style}
        className={`rounded-full object-cover shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      style={{ ...style, fontSize: size * 0.4 }}
      className={`rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold shrink-0 ${className}`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
