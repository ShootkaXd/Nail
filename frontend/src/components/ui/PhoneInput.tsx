import React from 'react'

// Format any digit soup into "+7 (XXX) XXX-XX-XX" as the user types
// (also normalizes browser autofill values like 89001234567 / +79001234567)
export function formatRuPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  // 8XXXXXXXXXX and 7XXXXXXXXXX → normalize to national 10 digits
  if (digits[0] === '8' || digits[0] === '7') digits = digits.slice(1)
  digits = digits.slice(0, 10)

  let out = '+7'
  if (digits.length > 0) out += ` (${digits.slice(0, 3)}`
  if (digits.length >= 4) out += `) ${digits.slice(3, 6)}`
  if (digits.length >= 7) out += `-${digits.slice(6, 8)}`
  if (digits.length >= 9) out += `-${digits.slice(8, 10)}`
  return out
}

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string
  error?: string
  value: string
  onChange: (formatted: string) => void
}

const PhoneInput = React.forwardRef<HTMLInputElement, Props>(
  ({ label, error, value, onChange, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <input
          ref={ref}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+7 (900) 123-45-67"
          value={value}
          onChange={e => onChange(formatRuPhone(e.target.value))}
          {...props}
          className={`rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 ${error ? 'border-red-400' : 'border-gray-300'} ${className}`}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)

PhoneInput.displayName = 'PhoneInput'
export default PhoneInput
