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

// Statuses that are finished/not-live (terminal or pre-game)
const NON_LIVE = new Set(['NS', 'FT', 'AW', 'AWD', 'WO', 'CANC', 'PST', 'INT', 'ABD', 'TBD', 'AET', 'AP', 'PEN'])

export function isLive(status: string): boolean {
  return !NON_LIVE.has(status)
}

export function isTerminal(status: string): boolean {
  return status === 'FT' || status === 'AW' || status === 'AWD' || status === 'WO' || status === 'ABD'
    || status === 'AET' || status === 'AP' || status === 'PEN'
}

export function formatDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
  } catch {
    return iso.slice(0, 10)
  }
}

export function makeShortName(name: string): string {
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length === 1) return name.slice(0, 3).toUpperCase()
  return words.map(w => w[0]).join('').slice(0, 3).toUpperCase()
}
