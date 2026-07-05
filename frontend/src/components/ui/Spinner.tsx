export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-200 border-t-brand-500" />
    </div>
  )
}
