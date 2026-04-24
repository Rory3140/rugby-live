'use client'
import { useRef } from 'react'
import { getWindowDates } from '@/lib/utils'

interface Props {
  selectedDate: string
  windowOffset: number
  onSelect: (date: string) => void
  onOffsetChange: (offset: number) => void
  onPickDate: (date: string, offset: number) => void
}

export default function DateScrubber({ selectedDate, windowOffset, onSelect, onOffsetChange, onPickDate }: Props) {
  const days = getWindowDates(windowOffset)
  const inputRef = useRef<HTMLInputElement>(null)

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (!val) return
    // Calculate offset to centre picked date at roughly index 2
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(val + 'T00:00:00')
    const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000)
    onPickDate(val, diff - 2)
  }

  const iconBtn: React.CSSProperties = {
    width: 36,
    height: 36,
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {/* Prev */}
      <button style={iconBtn} onClick={() => onOffsetChange(windowOffset - 1)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m14 6-6 6 6 6" />
        </svg>
      </button>

      {/* Day pills — full width, equal size */}
      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
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
                letterSpacing: '0.08em',
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

      {/* Next */}
      <button style={iconBtn} onClick={() => onOffsetChange(windowOffset + 1)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m10 6 6 6-6 6" />
        </svg>
      </button>

      {/* Calendar picker */}
      <div style={{ position: 'relative' }}>
        <button
          style={iconBtn}
          onClick={() => inputRef.current?.showPicker?.() ?? inputRef.current?.click()}
          title="Pick a date"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
        </button>
        <input
          ref={inputRef}
          type="date"
          value={selectedDate}
          onChange={handlePick}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    </div>
  )
}
