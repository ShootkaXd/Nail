// Normalizes any RU phone format (+7 (900) 123-45-67 / 89001234567 / 9001234567)
// to a stable 10-digit national key, used to match "my bookings" lookups
// regardless of how the number was typed at booking time.
export function normalizePhoneDigits(raw: string): string {
  let digits = (raw || '').replace(/\D/g, '')
  if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) {
    digits = digits.slice(1)
  }
  return digits.slice(-10)
}
