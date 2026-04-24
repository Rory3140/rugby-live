export const RL_COLORS: [string, string][] = [
  ['#1e40af', '#60a5fa'],
  ['#14532d', '#4ade80'],
  ['#7f1d1d', '#fca5a5'],
  ['#451a03', '#fbbf24'],
  ['#3b0764', '#c4b5fd'],
  ['#134e4a', '#5eead4'],
  ['#1f2937', '#9ca3af'],
  ['#581c87', '#e9d5ff'],
  ['#7c2d12', '#fb923c'],
  ['#164e63', '#67e8f9'],
]

export function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function isLive(status: string): boolean {
  return status !== 'NS' && status !== 'FT'
}

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function todayStr(): string {
  return formatDate(new Date())
}

export function getWindowDates(offset: number = 0) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tStr = formatDate(today)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() + i - 2 + offset)
    const dateStr = formatDate(d)
    const isToday = dateStr === tStr
    const label = isToday
      ? 'Today'
      : new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(d)
    const dayNum = new Intl.DateTimeFormat('en-GB', { day: 'numeric' }).format(d)
    return { date: dateStr, label, dayNum, isToday }
  })
}

export function formatKickoff(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(new Date(iso))
  } catch {
    return '--:--'
  }
}

export function formatMatchDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso.slice(0, 10)
  }
}

export function formatCardDate(iso: string): string {
  try {
    const d = new Date(iso)
    const currentYear = new Date().getFullYear()
    const opts: Intl.DateTimeFormatOptions = d.getFullYear() === currentYear
      ? { day: 'numeric', month: 'short' }
      : { day: 'numeric', month: 'short', year: 'numeric' }
    return new Intl.DateTimeFormat('en-GB', opts).format(d)
  } catch {
    return iso.slice(0, 10)
  }
}

export function makeShortName(name: string): string {
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length === 1) return name.slice(0, 3).toUpperCase()
  return words.map(w => w[0]).join('').slice(0, 3).toUpperCase()
}
