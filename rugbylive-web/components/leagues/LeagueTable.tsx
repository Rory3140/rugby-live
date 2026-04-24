'use client'
import TeamCrest from '@/components/ui/TeamCrest'
import type { Standing } from '@/types'

interface Props {
  standings: Standing[]
}

const COLS = ['P', 'W', 'D', 'L', 'PF', 'PA', 'PD']

export default function LeagueTable({ standings }: Props) {
  if (!standings.length) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: 'var(--text3)',
        fontSize: 13,
      }}>
        Standings not available for this competition.
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border2)' }}>
            <th style={{ width: 32, padding: '10px 16px 10px 16px' }} />
            <th style={{ textAlign: 'left', padding: '10px 8px' }}>
              <span className="rl-label">Team</span>
            </th>
            {COLS.map(k => (
              <th key={k} style={{ width: 36, padding: '10px 4px', textAlign: 'center' }}>
                <span className="rl-label">{k}</span>
              </th>
            ))}
            <th style={{ width: 46, padding: '10px 16px 10px 4px', textAlign: 'right' }}>
              <span className="rl-label" style={{ color: 'var(--accent)' }}>PTS</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => {
            const leader = i === 0
            return (
              <tr
                key={s.team.id}
                style={{
                  borderBottom: i < standings.length - 1 ? '1px solid var(--border2)' : 'none',
                  position: 'relative',
                }}
              >
                <td style={{ padding: '12px 16px', position: 'relative' }}>
                  {leader && (
                    <span style={{
                      position: 'absolute',
                      left: 0,
                      top: 8,
                      bottom: 8,
                      width: 2,
                      background: 'var(--accent)',
                      borderRadius: 2,
                    }} />
                  )}
                  <span className="rl-mono" style={{
                    fontSize: 12,
                    color: leader ? 'var(--accent)' : 'var(--text3)',
                    fontWeight: 600,
                  }}>
                    {s.position}
                  </span>
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <TeamCrest team={s.team} size={20} />
                    <span style={{
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 160,
                    }}>
                      {s.team.name}
                    </span>
                  </div>
                </td>
                {[s.played, s.won, s.drawn, s.lost, s.pointsFor, s.pointsAgainst].map((v, j) => (
                  <td key={j} className="rl-mono" style={{
                    fontSize: 12,
                    textAlign: 'center',
                    color: 'var(--text2)',
                    padding: '12px 4px',
                  }}>
                    {v}
                  </td>
                ))}
                <td className="rl-mono" style={{
                  fontSize: 12,
                  textAlign: 'center',
                  color: s.pointsDiff > 0 ? 'var(--green)' : s.pointsDiff < 0 ? 'var(--text3)' : 'var(--text2)',
                  fontWeight: 600,
                  padding: '12px 4px',
                }}>
                  {s.pointsDiff > 0 ? `+${s.pointsDiff}` : s.pointsDiff}
                </td>
                <td className="rl-mono" style={{
                  fontSize: 14,
                  textAlign: 'right',
                  color: 'var(--accent)',
                  fontWeight: 700,
                  padding: '12px 16px 12px 4px',
                }}>
                  {s.points}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
