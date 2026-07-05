interface Props {
  address: string
  title?: string
  height?: number
  className?: string
}

// Yandex Maps supports a keyless "map-widget" embed via a plain text search
// query — good enough to drop a pin on a free-text address without wiring
// up a geocoding API. More relevant for a Russian audience than Google Maps.
export default function MapEmbed({ address, title, height = 220, className = '' }: Props) {
  const src = `https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(address)}&z=16`

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
