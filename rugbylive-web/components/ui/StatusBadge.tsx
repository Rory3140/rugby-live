import LiveBadge from './LiveBadge'
import { isLive, formatKickoff } from '@/lib/utils'

interface Props {
  status: string
  kickoff: string
}

export default function StatusBadge({ status, kickoff }: Props) {
  if (isLive(status)) return <LiveBadge clock={status} />

  if (status === 'FT') {
    return (
      <span className="rl-mono" style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.08em' }}>
        FT
      </span>
    )
  }

  return (
    <span className="rl-mono" style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>
      {formatKickoff(kickoff)}
    </span>
  )
}
