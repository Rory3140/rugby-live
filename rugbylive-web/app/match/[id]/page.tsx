'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useMatch, useH2H } from '@/hooks/useMatch'
import MatchHero from '@/components/match/MatchHero'
import MatchCard from '@/components/matches/MatchCard'

type Tab = 'Score' | 'H2H'

export default function MatchPage({ params }: { params: { id: string } }) {
  const [tab, setTab] = useState<Tab>('Score')
  const { data: match, isLoading } = useMatch(params.id)
  const { data: h2h = [] } = useH2H(params.id)

  if (isLoading) {
    return (
      <div style={{ padding: '24px 20px' }}>
        <div className="rl-skeleton" style={{ height: 20, width: 200, marginBottom: 20 }} />
        <div className="rl-skeleton" style={{ height: 260, borderRadius: 12 }} />
      </div>
    )
  }

  if (!match) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text3)' }}>
        Match not found.
      </div>
    )
  }

  const hasPeriods = match.periods.first.home != null || match.periods.second.home != null

  return (
    <div style={{ padding: '24px 20px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 12, color: 'var(--text3)', flexWrap: 'wrap' }}>
        <Link href="/matches" style={{ color: 'var(--text3)', transition: 'color 160ms ease' }}>Matches</Link>
        <span>/</span>
        <Link href={`/leagues/${match.competition.id}`} style={{ color: 'var(--text3)', transition: 'color 160ms ease' }}>
          {match.competition.name}
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--text2)' }}>
          {match.homeTeam.shortName} vs {match.awayTeam.shortName}
        </span>
      </div>

      {/* Hero */}
      <div style={{ marginBottom: 20 }}>
        <MatchHero match={match} />
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {(['Score', 'H2H'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: tab === t ? 600 : 500,
              color: tab === t ? 'var(--text)' : 'var(--text2)',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
              marginBottom: -1,
              transition: 'color 200ms ease',
              background: 'none',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {tab === 'Score' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {hasPeriods && (
              <div style={{
                background: 'var(--surf)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '16px 20px',
              }}>
                <div className="rl-label" style={{ marginBottom: 14 }}>Half-time Scores</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    { label: 'First Half', p: match.periods.first },
                    { label: 'Second Half', p: match.periods.second },
                  ].map(({ label, p }) => p.home != null && (
                    <div key={label} style={{
                      flex: 1,
                      padding: '12px 16px',
                      background: 'var(--surf2)',
                      borderRadius: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
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

            {!hasPeriods && match.status === 'FT' && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                Half-time scores not available for this match.
              </div>
            )}
          </div>
        )}

        {tab === 'H2H' && (
          h2h.length > 0
            ? <div>
                <div className="rl-label" style={{ marginBottom: 12 }}>Head to Head</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {h2h.map(m => <MatchCard key={m.id} match={m} showDate showComp />)}
                </div>
              </div>
            : <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                No previous meetings found.
              </div>
        )}
      </motion.div>
    </div>
  )
}
