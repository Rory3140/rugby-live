'use client'
import type { Lineups, Team } from '@/types'

interface Props {
  lineups: Lineups
  homeTeam: Team
  awayTeam: Team
}

function PlayerRow({ number, name, position }: { number: number | null; name: string; position: string | null }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '7px 0',
      borderBottom: '1px solid var(--border2)',
    }}>
      {number != null && (
        <span className="rl-mono" style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text3)',
          width: 20,
          textAlign: 'center',
          flexShrink: 0,
        }}>
          {number}
        </span>
      )}
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1, minWidth: 0 }}>
        {name}
      </span>
      {position && (
        <span style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>
          {position}
        </span>
      )}
    </div>
  )
}

function TeamColumn({ team, starters, substitutes }: {
  team: Team
  starters: Lineups['home']['starters']
  substitutes: Lineups['home']['substitutes']
}) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--text2)',
        letterSpacing: '0.06em',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        {team.name.toUpperCase()}
      </div>

      <div className="rl-label" style={{ marginBottom: 8 }}>Starting XV</div>
      {starters.map((p, i) => (
        <PlayerRow key={i} number={p.number} name={p.name} position={p.position} />
      ))}

      {substitutes.length > 0 && (
        <>
          <div className="rl-label" style={{ marginTop: 16, marginBottom: 8 }}>Bench</div>
          {substitutes.map((p, i) => (
            <PlayerRow key={i} number={p.number} name={p.name} position={p.position} />
          ))}
        </>
      )}
    </div>
  )
}

export default function MatchLineups({ lineups, homeTeam, awayTeam }: Props) {
  return (
    <div style={{
      background: 'var(--surf)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '20px',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1px 1fr',
        gap: '0 20px',
      }}>
        <TeamColumn team={homeTeam} starters={lineups.home.starters} substitutes={lineups.home.substitutes} />

        {/* Divider */}
        <div style={{ background: 'var(--border)', width: 1 }} />

        <TeamColumn team={awayTeam} starters={lineups.away.starters} substitutes={lineups.away.substitutes} />
      </div>
    </div>
  )
}
