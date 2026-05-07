'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useMatchDetail } from '@/hooks/useMatch'
import MatchHero from '@/components/match/MatchHero'
import MatchLineups from '@/components/match/MatchLineups'
import MatchTimeline from '@/components/match/MatchTimeline'
import MatchHighlights from '@/components/match/MatchHighlights'
import MatchCard from '@/components/matches/MatchCard'
import type { Match } from '@/types'

function ProbBar({ homeProb, drawProb, awayProb, homeTeam, awayTeam }: {
  homeProb: string; drawProb: string; awayProb: string
  homeTeam: string; awayTeam: string
}) {
  const h = parseFloat(homeProb) || 0
  const d = parseFloat(drawProb) || 0
  const a = parseFloat(awayProb) || 0
  const total = h + d + a || 100
  const hw = (h / total * 100).toFixed(1)
  const dw = (d / total * 100).toFixed(1)
  const aw = (a / total * 100).toFixed(1)

  return (
    <div style={{ background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
      <div className="rl-label" style={{ marginBottom: 14 }}>Win Probability</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', fontSize: 12 }}>
        <span style={{ color: 'var(--text2)', flex: 1 }}>{homeTeam}</span>
        <span className="rl-mono" style={{ color: 'var(--text3)', fontSize: 11 }}>Draw</span>
        <span style={{ color: 'var(--text2)', flex: 1, textAlign: 'right' }}>{awayTeam}</span>
      </div>
      <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', gap: 2 }}>
        <div style={{ width: `${hw}%`, background: 'var(--accent)', borderRadius: '999px 0 0 999px', minWidth: h > 0 ? 4 : 0 }} />
        <div style={{ width: `${dw}%`, background: 'var(--surf4)', minWidth: d > 0 ? 4 : 0 }} />
        <div style={{ width: `${aw}%`, background: 'var(--text3)', borderRadius: '0 999px 999px 0', minWidth: a > 0 ? 4 : 0 }} />
      </div>
      <div style={{ display: 'flex', marginTop: 8, fontSize: 12 }}>
        <span className="rl-mono" style={{ color: 'var(--accent)', fontWeight: 700, flex: 1 }}>{hw}%</span>
        <span className="rl-mono" style={{ color: 'var(--text3)', fontWeight: 600 }}>{dw}%</span>
        <span className="rl-mono" style={{ color: 'var(--text2)', fontWeight: 700, flex: 1, textAlign: 'right' }}>{aw}%</span>
      </div>
    </div>
  )
}

export default function MatchPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: detail, isLoading } = useMatchDetail(params.id)

  const tabs = useMemo(() => {
    if (!detail) return ['Score'] as string[]
    const t: string[] = ['Score']
    if (detail.lineups) t.push('Lineups')
    if (detail.incidents.length > 0) t.push('Timeline')
    if (detail.highlights.length > 0) t.push('Highlights')
    t.push('H2H')
    return t
  }, [detail])

  const [tab, setTab] = useState('Score')
  const activeTab = tabs.includes(tab) ? tab : tabs[0]

  if (isLoading) {
    return (
      <div style={{ padding: '24px 20px' }}>
        <div className="rl-skeleton" style={{ height: 20, width: 200, marginBottom: 20 }} />
        <div className="rl-skeleton" style={{ height: 280, borderRadius: 12 }} />
      </div>
    )
  }

  if (!detail) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text3)' }}>
        Match not found.
      </div>
    )
  }

  const { match, venue, referee, predictions, lineups, incidents, highlights, h2h } = detail
  const hasPeriods = match.periods.first.home != null || match.periods.second.home != null

  return (
    <div style={{ padding: '24px 20px', maxWidth: 800, margin: '0 auto' }}>
      {/* Back + breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 32, padding: '0 12px',
            borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--surf)', color: 'var(--text2)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            transition: 'border-color 160ms ease, color 160ms ease',
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text3)', minWidth: 0 }}>
          <Link href={`/leagues/${match.competition.id}`} style={{ color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {match.competition.name}
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--text2)', whiteSpace: 'nowrap' }}>
            {match.homeTeam.shortName} vs {match.awayTeam.shortName}
          </span>
        </div>
      </div>

      {/* Hero */}
      <div style={{ marginBottom: 20 }}>
        <MatchHero match={match} venue={venue} referee={referee} />
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20, overflowX: 'auto' }}>
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: activeTab === t ? 600 : 500,
              color: activeTab === t ? 'var(--text)' : 'var(--text2)',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              borderBottom: `2px solid ${activeTab === t ? 'var(--accent)' : 'transparent'}`,
              marginBottom: -1,
              transition: 'color 200ms ease',
              background: 'none',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        {/* Score */}
        {activeTab === 'Score' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {hasPeriods && (
              <div style={{ background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
                <div className="rl-label" style={{ marginBottom: 14 }}>Half Scores</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {([
                    { label: 'First Half', p: match.periods.first },
                    { label: 'Second Half', p: match.periods.second },
                    ...(match.periods.overtime.home != null ? [{ label: 'Extra Time', p: match.periods.overtime }] : []),
                  ] as { label: string; p: { home: number | null; away: number | null } }[])
                    .filter(({ p }) => p.home != null)
                    .map(({ label, p }) => (
                      <div key={label} style={{
                        flex: 1, padding: '12px 16px', background: 'var(--surf2)', borderRadius: 8,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{label}</span>
                        <span className="rl-mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                          {p.home} – {p.away}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {predictions?.homeProb && (
              <ProbBar
                homeProb={predictions.homeProb}
                drawProb={predictions.drawProb ?? '0'}
                awayProb={predictions.awayProb ?? '0'}
                homeTeam={match.homeTeam.shortName}
                awayTeam={match.awayTeam.shortName}
              />
            )}

            {!hasPeriods && !predictions && (
              <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                No additional score data available.
              </div>
            )}
          </div>
        )}

        {/* Lineups */}
        {activeTab === 'Lineups' && lineups && (
          <MatchLineups lineups={lineups} homeTeam={match.homeTeam} awayTeam={match.awayTeam} />
        )}

        {/* Timeline */}
        {activeTab === 'Timeline' && incidents.length > 0 && (
          <MatchTimeline incidents={incidents} homeTeam={match.homeTeam} awayTeam={match.awayTeam} />
        )}

        {/* Highlights */}
        {activeTab === 'Highlights' && highlights.length > 0 && (
          <MatchHighlights highlights={highlights} />
        )}

        {/* H2H */}
        {activeTab === 'H2H' && (
          h2h ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 24px' }}>
                <div className="rl-label" style={{ marginBottom: 16 }}>All Time Record</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {[
                    { label: match.homeTeam.shortName, value: h2h.homeWins },
                    { label: 'Draws', value: h2h.draws },
                    { label: match.awayTeam.shortName, value: h2h.awayWins },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      textAlign: 'center', padding: '16px 12px', background: 'var(--surf2)', borderRadius: 8,
                    }}>
                      <div className="rl-mono" style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', lineHeight: 1, marginBottom: 6 }}>
                        {value}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {h2h.recentMatches.length > 0 && (
                <div style={{ background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
                  <div className="rl-label" style={{ marginBottom: 14 }}>Recent Meetings</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {h2h.recentMatches.map((m: Match) => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              No head-to-head data available.
            </div>
          )
        )}
      </motion.div>
    </div>
  )
}
