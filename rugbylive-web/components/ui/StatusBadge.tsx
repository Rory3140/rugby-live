import LiveBadge from './LiveBadge'
import { isLive, formatKickoff } from '@/lib/utils'

interface Props {
  status: string
  kickoff: string
}

export default function StatusBadge({ status, kickoff }: Props) {
  if (isLive(status)) return <LiveBadge clock={status} />

  if (status === 'FT' || status === 'AET' || status === 'AP' || status === 'PEN') {
    return (
      <span className="rl-mono" style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.08em' }}>
        FT
      </span>
    )
  }

  if (status === 'AW' || status === 'AWD' || status === 'WO' || status === 'ABD') {
    return (
      <span className="rl-mono" style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.08em' }}>
        W/O
      </span>
    )
  }

  if (status === 'CANC' || status === 'PST') {
    return (
      <span className="rl-mono" style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, letterSpacing: '0.06em' }}>
        {status === 'CANC' ? 'CANC' : 'PPD'}
      </span>
    )
  }

  return (
    <span className="rl-mono" style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>
      {formatKickoff(kickoff)}
    </span>
  )
}
