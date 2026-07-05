interface Props {
  address: string
  title?: string
  height?: number
  className?: string
}

// Google Maps supports a keyless embed via a plain text query — good enough
// to drop a pin on a free-text address without wiring up a geocoding API.
export default function MapEmbed({ address, title, height = 220, className = '' }: Props) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`

  return (
    <div className={`rounded-xl overflow-hidden border border-gray-200 ${className}`}>
      <iframe
        title={title ?? `Карта: ${address}`}
        src={src}
        width="100%"
        height={height}
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}
