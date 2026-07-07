import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' }
const EXIT_MS = 180

export default function Modal({ open, onClose, title, children, size = 'md' }: Props) {
  // Keep the modal mounted briefly after `open` flips false so the exit
  // transition can play instead of the panel just vanishing.
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      setClosing(false)
    } else if (mounted) {
      setClosing(true)
      const t = setTimeout(() => setMounted(false), EXIT_MS)
      return () => clearTimeout(t)
    }
  }, [open, mounted])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${closing ? 'opacity-0' : 'opacity-100 animate-fade-in'}`}
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-2xl shadow-xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto transition-all duration-200 ${
          closing ? 'opacity-0 scale-95' : 'opacity-100 scale-100 animate-scale-in'
        }`}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors hover:rotate-90 duration-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
