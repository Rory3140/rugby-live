'use client'
import type { Incident, Team } from '@/types'

interface Props {
  incidents: Incident[]
  homeTeam: Team
  awayTeam: Team
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  try:          { label: 'Try',   color: 'var(--accent)',  bg: 'var(--accent2)' },
  twoPoints:    { label: 'Try',   color: 'var(--accent)',  bg: 'var(--accent2)' },
  conversion:   { label: 'Con',   color: 'var(--text2)',   bg: 'var(--surf3)' },
  onePoint:     { label: 'Con',   color: 'var(--text2)',   bg: 'var(--surf3)' },
  penalty:      { label: 'Pen',   color: 'var(--text)',    bg: 'var(--surf3)' },
  threePoints:  { label: 'Pen',   color: 'var(--text)',    bg: 'var(--surf3)' },
  drop_goal:    { label: 'DG',    color: 'var(--text)',    bg: 'var(--surf3)' },
  dropGoal:     { label: 'DG',    color: 'var(--text)',    bg: 'var(--surf3)' },
  yellow_card:  { label: 'YC',    color: '#f59e0b',        bg: 'rgba(245,158,11,0.12)' },
  yellowcard:   { label: 'YC',    color: '#f59e0b',        bg: 'rgba(245,158,11,0.12)' },
  red_card:     { label: 'RC',    color: 'var(--live)',    bg: 'var(--live2)' },
  redcard:      { label: 'RC',    color: 'var(--live)',    bg: 'var(--live2)' },
}

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? { label: type.slice(0, 3).toUpperCase(), color: 'var(--text3)', bg: 'var(--surf3)' }
}

function IncidentPill({ incident }: { incident: Incident }) {
  const cfg = getConfig(incident.type)
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '4px 8px',
      borderRadius: 6,
      background: cfg.bg,
      maxWidth: '100%',
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, flexShrink: 0 }}>
        {cfg.label}
      </span>
      {incident.playerName && (
        <span style={{ fontSize: 11, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {incident.playerName}
        </span>
      )}
    </div>
  )
}

export default function MatchTimeline({ incidents, homeTeam, awayTeam }: Props) {
  const sorted = [...incidents].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))

  return (
    <div style={{
      background: 'var(--surf)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '20px',
    }}>
      <div className="rl-label" style={{ marginBottom: 16 }}>Match Timeline</div>

      {/* Team header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 48px 1fr',
        gap: 8,
        marginBottom: 12,
        paddingBottom: 10,
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>{homeTeam.shortName}</div>
        <div />
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textAlign: 'right' }}>{awayTeam.shortName}</div>
      </div>

      {/* Events */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {sorted.map((inc) => (
          <div key={inc.id} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 48px 1fr',
            gap: 8,
            alignItems: 'center',
            minHeight: 36,
          }}>
            {/* Home side */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              {inc.team === 'home' && <IncidentPill incident={inc} />}
            </div>

            {/* Minute + score */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <span className="rl-mono" style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>
                {inc.minute != null ? `${inc.minute}'` : '–'}
              </span>
              {(inc.homeScore != null && inc.awayScore != null) && (
                <span className="rl-mono" style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700 }}>
                  {inc.homeScore}–{inc.awayScore}
                </span>
              )}
            </div>

            {/* Away side */}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              {inc.team === 'away' && <IncidentPill incident={inc} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
