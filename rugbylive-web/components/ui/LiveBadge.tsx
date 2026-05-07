interface Props {
  clock?: string
}

function formatClock(raw: string): string {
  if (raw === '1H') return '1ST'
  if (raw === '2H') return '2ND'
  if (raw === 'HT') return 'HT'
  return raw
}

export default function LiveBadge({ clock = 'LIVE' }: Props) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '3px 8px 3px 7px',
      borderRadius: 999,
      background: 'var(--live2)',
      color: 'var(--live)',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.02em',
      flexShrink: 0,
    }}>
      <span className="rl-live-dot" />
      <span>{formatClock(clock)}</span>
    </span>
  )
}
