'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useMatch, useH2H } from '@/hooks/useMatch'
import MatchHero from '@/components/match/MatchHero'

type Tab = 'Score' | 'H2H'

export default function MatchPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('Score')
  const { data: match, isLoading } = useMatch(params.id)
  const { data: h2h } = useH2H(params.id)

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
      {/* Back button + breadcrumb */}
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
          <Link href={`/leagues/${match.competition.id}`} style={{ color: 'var(--text3)', transition: 'color 160ms ease', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
          h2h
            ? <div style={{
                background: 'var(--surf)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '20px 24px',
              }}>
                <div className="rl-label" style={{ marginBottom: 16 }}>Head to Head</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {[
                    { label: match.homeTeam.shortName, value: h2h.homeWins, accent: true },
                    { label: 'Draws', value: h2h.draws, accent: false },
                    { label: match.awayTeam.shortName, value: h2h.awayWins, accent: true },
                  ].map(({ label, value, accent }) => (
                    <div key={label} style={{
                      textAlign: 'center',
                      padding: '16px 12px',
                      background: 'var(--surf2)',
                      borderRadius: 8,
                    }}>
                      <div className="rl-mono" style={{
                        fontSize: 32,
                        fontWeight: 700,
                        color: accent ? 'var(--text)' : 'var(--text2)',
                        lineHeight: 1,
                        marginBottom: 6,
                      }}>
                        {value}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            : <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                No head-to-head data available.
              </div>
        )}
      </motion.div>
    </div>
  )
}
