// Shape-matched loading placeholder for a grid of selectable cards
// (services, masters, gallery sections) — replaces the generic spinner.
export default function CardSkeleton({ count = 4, rows = 2 }: { count?: number; rows?: number }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-2xl border-2 border-gray-100">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/5 rounded" />
              {rows > 1 && <div className="skeleton h-3 w-4/5 rounded" />}
            </div>
            <div className="space-y-2 shrink-0">
              <div className="skeleton h-4 w-12 rounded" />
              <div className="skeleton h-3 w-8 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
