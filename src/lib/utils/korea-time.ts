const KOREA_TIME_ZONE = 'Asia/Seoul'

const koreaDateFormatter = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  month: '2-digit',
  timeZone: KOREA_TIME_ZONE,
  year: 'numeric',
})

const koreaTimePartsFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  hour12: false,
  minute: '2-digit',
  timeZone: KOREA_TIME_ZONE,
})

export function formatKoreaTime(date: Date, options?: Intl.DateTimeFormatOptions) {
  return date.toLocaleTimeString('ko-KR', {
    timeZone: KOREA_TIME_ZONE,
    ...options,
  })
}

export function getKoreaDateParts(date: Date) {
  const parts = Object.fromEntries(koreaDateFormatter.formatToParts(date).map((part) => [part.type, part.value]))
  return {
    day: Number(parts.day),
    month: Number(parts.month),
    year: Number(parts.year),
  }
}

export function getKoreaMinutes(date: Date) {
  const parts = Object.fromEntries(koreaTimePartsFormatter.formatToParts(date).map((part) => [part.type, part.value]))
  const hour = Number(parts.hour) % 24
  return hour * 60 + Number(parts.minute)
}

export function toKoreaDateKey(date: Date) {
  const { day, month, year } = getKoreaDateParts(date)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function toStoredKoreaDate(date: Date) {
  const { day, month, year } = getKoreaDateParts(date)
  return new Date(Date.UTC(year, month - 1, day))
}
