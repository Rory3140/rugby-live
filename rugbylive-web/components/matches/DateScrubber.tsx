'use client'
import { useRef } from 'react'
import { getWindowDates } from '@/lib/utils'

interface Props {
  selectedDate: string
  windowOffset: number
  onSelect: (date: string) => void
  onOffsetChange: (offset: number) => void
  onPickDate: (date: string, offset: number) => void
  onStep?: (dir: 1 | -1) => void
  inputRef?: React.RefObject<HTMLInputElement>
}

export default function DateScrubber({ selectedDate, windowOffset, onSelect, onOffsetChange, onPickDate, onStep, inputRef: externalRef }: Props) {
  const days = getWindowDates(windowOffset)
  const internalRef = useRef<HTMLInputElement>(null)
  const inputRef = externalRef ?? internalRef

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (!val) return
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(val + 'T00:00:00')
    const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000)
    onPickDate(val, diff - 2)
  }

const todayDate = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
  const displayLabel = selectedDate === todayDate
    ? 'Today'
    : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const firstDay = new Date(days[0].date + 'T00:00:00')
  const lastDay  = new Date(days[days.length - 1].date + 'T00:00:00')
  const monthLabel = firstDay.getMonth() === lastDay.getMonth()
    ? firstDay.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : `${firstDay.toLocaleDateString('en-GB', { month: 'long' })} / ${lastDay.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`

  const iconBtn: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surf)',
    color: 'var(--text2)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'border-color 160ms ease, color 160ms ease',
    cursor: 'pointer',
  }

  return (
    <>
      {/* ── Mobile layout (hidden on md+) ── */}
      <div className="flex md:hidden" style={{ alignItems: 'center', gap: 8 }}>
        <button style={iconBtn} onClick={() => onStep?.(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m14 6-6 6 6 6" />
          </svg>
        </button>

        <div style={{ flex: 1, position: 'relative' }}>
          <button
            onClick={() => inputRef.current?.showPicker?.() ?? inputRef.current?.click()}
            style={{
              width: '100%',
              height: 44,
              borderRadius: 10,
              background: 'var(--surf)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'border-color 160ms ease',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: selectedDate === todayDate ? 'var(--accent)' : 'var(--text)' }}>
              {displayLabel}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <input
            ref={inputRef}
            type="date"
            value={selectedDate}
            onChange={handlePick}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, pointerEvents: 'none' }}
          />
        </div>

        <button style={iconBtn} onClick={() => onStep?.(1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m10 6 6 6-6 6" />
          </svg>
        </button>
      </div>

      {/* ── Desktop layout (hidden below md) ── */}
      <div className="hidden md:block">
        {/* Month label */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          {monthLabel}
        </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{ ...iconBtn, width: 36, height: 36 }} onClick={() => onOffsetChange(windowOffset - 7)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m14 6-6 6 6 6" />
          </svg>
        </button>

        <div style={{ display: 'flex', gap: 6, flex: 1 }}>
          {days.map(d => {
            const active = d.date === selectedDate
            return (
              <button
                key={d.date}
                onClick={() => onSelect(d.date)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 56,
                  borderRadius: 8,
                  background: active ? 'var(--accent)' : 'var(--surf)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  color: active ? 'var(--bg)' : 'var(--text)',
                  cursor: 'pointer',
                  transition: 'background 180ms ease, border-color 180ms ease, color 180ms ease',
                  minWidth: 0,
                }}
              >
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: d.isToday ? '0.02em' : '0.08em',
                  color: active ? 'var(--bg)' : d.isToday ? 'var(--accent)' : 'var(--text3)',
                  transition: 'color 180ms ease',
                }}>
                  {d.label}
                </span>
                <span className="rl-mono" style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>
                  {d.dayNum}
                </span>
              </button>
            )
          })}
        </div>

        <button style={{ ...iconBtn, width: 36, height: 36 }} onClick={() => onOffsetChange(windowOffset + 7)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m10 6 6 6-6 6" />
          </svg>
        </button>
      </div>
      </div>
    </>
  )
}
