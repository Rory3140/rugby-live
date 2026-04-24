'use client'
import Link from 'next/link'
import CompLogo from '@/components/ui/CompLogo'
import FollowButton from '@/components/ui/FollowButton'
import LiveBadge from '@/components/ui/LiveBadge'
import { useFollowStore } from '@/store/useFollowStore'
import type { Competition } from '@/types'

interface Props {
  competition: Competition
  round?: string | null
  liveCount: number
}

export default function CompGroupHeader({ competition, round, liveCount }: Props) {
  const isFollowing = useFollowStore(s => s.isFollowingLeague(competition.id))
  const follow = useFollowStore(s => s.followLeague)
  const unfollow = useFollowStore(s => s.unfollowLeague)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 4px',
      borderBottom: '1px solid var(--border)',
      marginBottom: 14,
    }}>
      <Link href={`/leagues/${competition.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <CompLogo comp={competition} size={32} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {competition.name}
          </div>
          {round && (
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
              Round {round}
            </div>
          )}
        </div>
      </Link>

      {liveCount > 0 && (
        <LiveBadge clock={`${liveCount} Live`} />
      )}

      <FollowButton
        following={isFollowing}
        onToggle={() => isFollowing ? unfollow(competition.id) : follow(competition.id)}
      />
    </div>
  )
}
