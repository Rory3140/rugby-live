'use client'
import Link from 'next/link'
import TeamCrest from '@/components/ui/TeamCrest'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Match } from '@/types'
import { isLive, formatCardDate } from '@/lib/utils'

interface Props {
  match: Match
  showDate?: boolean
  showComp?: boolean
}

export default function MatchCard({ match, showDate, showComp }: Props) {
  const { id, homeTeam, awayTeam, homeScore, awayScore, status, kickoff } = match
  const live = isLive(status)
  const finished = status === 'FT'

  const homeWon = finished && homeScore != null && awayScore != null && homeScore > awayScore
  const awayWon = finished && homeScore != null && awayScore != null && awayScore > homeScore

  const roundLabel = match.week
    ? /^\d+$/.test(match.week) ? `Rd ${match.week}` : match.week
    : null

  return (
    <Link href={`/match/${id}`} style={{ display: 'block' }}>
      <div className="rl-card" style={{ padding: 14 }}>
        <TeamRow team={homeTeam} score={homeScore} won={homeWon} finished={finished} live={live} />
        <div style={{ height: 8 }} />
        <TeamRow team={awayTeam} score={awayScore} won={awayWon} finished={finished} live={live} />

        <div style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px solid var(--border2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <StatusBadge status={status} kickoff={kickoff} />
            {showComp && (
              <span style={{
                fontSize: 11,
                color: 'var(--text3)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                · {match.competition.name}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {showDate && (
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                {formatCardDate(kickoff)}
              </span>
            )}
            {roundLabel && (
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                {roundLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

function TeamRow({
  team, score, won, finished, live,
}: {
  team: { name: string; shortName: string; logoUrl: string | null }
  score: number | null
  won: boolean
  finished: boolean
  live: boolean
}) {
  const scoreColor = finished
    ? won ? 'var(--text)' : 'var(--text2)'
    : 'var(--text)'
  const scoreWeight = finished && won ? 700 : 500

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <TeamCrest team={team} size={22} />
      <span style={{
        flex: 1,
        fontSize: 14,
        fontWeight: won ? 600 : 500,
        color: 'var(--text)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {team.name}
      </span>
      <span className="rl-mono" style={{
        fontSize: 14,
        fontWeight: scoreWeight,
        color: scoreColor,
        minWidth: 24,
        textAlign: 'right',
      }}>
        {score == null ? (live ? '–' : '') : score}
      </span>
    </div>
  )
}
