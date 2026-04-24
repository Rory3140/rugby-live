'use client'
import TeamCrest from '@/components/ui/TeamCrest'
import CompLogo from '@/components/ui/CompLogo'
import LiveBadge from '@/components/ui/LiveBadge'
import type { Match } from '@/types'
import { isLive, formatKickoff } from '@/lib/utils'

interface Props {
  match: Match
}

export default function MatchHero({ match }: Props) {
  const { homeTeam, awayTeam, homeScore, awayScore, status, kickoff, competition, week } = match
  const live = isLive(status)
  const finished = status === 'FT'
  const scoreColor = live ? 'var(--live)' : 'var(--text)'

  const homeWon = finished && homeScore != null && awayScore != null && homeScore > awayScore
  const awayWon = finished && homeScore != null && awayScore != null && awayScore > homeScore

  return (
    <div style={{
      background: 'var(--surf)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '20px 24px',
    }}>
      {/* Competition strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <CompLogo comp={competition} size={22} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>
          {competition.name}
        </span>
        {week && (
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>· Round {week}</span>
        )}
        <div style={{ flex: 1 }} />
        {live && <LiveBadge clock={status} />}
      </div>

      {/* Score row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 18,
      }}>
        {/* Home */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <TeamCrest team={homeTeam} size={54} />
          <div style={{
            fontSize: 14,
            fontWeight: homeWon ? 700 : 600,
            textAlign: 'center',
            color: 'var(--text)',
          }}>
            {homeTeam.name}
          </div>
          <div className="rl-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.12em' }}>
            HOME
          </div>
        </div>

        {/* Scores */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="rl-display" style={{
            fontSize: 56,
            lineHeight: 1,
            letterSpacing: '0.08em',
            color: homeWon ? 'var(--text)' : homeScore != null && awayScore != null && !homeWon && finished ? 'var(--text2)' : scoreColor,
            fontVariantNumeric: 'tabular-nums',
            transition: 'color 400ms ease',
          }}>
            {homeScore ?? (status === 'NS' ? '–' : '0')}
          </span>
          <span className="rl-display" style={{ fontSize: 28, color: 'var(--text3)', lineHeight: 1 }}>–</span>
          <span className="rl-display" style={{
            fontSize: 56,
            lineHeight: 1,
            letterSpacing: '0.08em',
            color: awayWon ? 'var(--text)' : awayScore != null && homeScore != null && !awayWon && finished ? 'var(--text2)' : scoreColor,
            fontVariantNumeric: 'tabular-nums',
            transition: 'color 400ms ease',
          }}>
            {awayScore ?? (status === 'NS' ? '–' : '0')}
          </span>
        </div>

        {/* Away */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <TeamCrest team={awayTeam} size={54} />
          <div style={{
            fontSize: 14,
            fontWeight: awayWon ? 700 : 600,
            textAlign: 'center',
            color: 'var(--text)',
          }}>
            {awayTeam.name}
          </div>
          <div className="rl-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.12em' }}>
            AWAY
          </div>
        </div>
      </div>

      {/* Kickoff strip */}
      <div style={{
        marginTop: 20,
        paddingTop: 14,
        borderTop: '1px solid var(--border2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontSize: 11,
        color: 'var(--text3)',
      }}>
        <span className="rl-mono">{formatKickoff(kickoff)}</span>
        <span>·</span>
        <span>{new Date(kickoff).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  )
}
