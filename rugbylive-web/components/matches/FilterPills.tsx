'use client'

export type FilterType = 'All' | 'Live Now' | 'Finished' | 'Upcoming'

interface Props {
  active: FilterType
  counts: { all: number; live: number; finished: number; upcoming: number }
  onChange: (f: FilterType) => void
}

const PILLS: { label: FilterType; countKey: keyof Props['counts']; live?: boolean }[] = [
  { label: 'All',      countKey: 'all' },
  { label: 'Live Now', countKey: 'live',     live: true },
  { label: 'Finished', countKey: 'finished' },
  { label: 'Upcoming', countKey: 'upcoming' },
]

export default function FilterPills({ active, counts, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {PILLS.map(pill => {
        const on = pill.label === active
        const count = counts[pill.countKey]
        return (
          <button
            key={pill.label}
            onClick={() => onChange(pill.label)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 999,
              border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
              background: on ? 'var(--accent2)' : 'var(--surf)',
              color: on ? 'var(--accent)' : 'var(--text2)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 160ms ease',
              minHeight: 44,
            }}
          >
            {pill.live && <span className="rl-live-dot" />}
            <span>{pill.label}</span>
            <span className="rl-mono" style={{
              fontSize: 11,
              color: on ? 'var(--accent)' : 'var(--text3)',
            }}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
