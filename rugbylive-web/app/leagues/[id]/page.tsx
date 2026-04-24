'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useStandings, useLeagueMatches } from '@/hooks/useStandings'
import { useLeague } from '@/hooks/useLeagues'
import { useFollowStore } from '@/store/useFollowStore'
import LeagueTable from '@/components/leagues/LeagueTable'
import MatchCard from '@/components/matches/MatchCard'
import CompLogo from '@/components/ui/CompLogo'
import FollowButton from '@/components/ui/FollowButton'
import type { Match } from '@/types'

type Tab = 'Standings' | 'Fixtures' | 'Results'

export default function LeaguePage({ params }: { params: { id: string } }) {
  const [tab, setTab] = useState<Tab>('Standings')

  const { data: league } = useLeague(params.id)
  const season = league?.currentSeason ?? undefined

  const { data: standings = [], isLoading: loadingStandings } = useStandings(params.id, season)
  const { data: allMatches = [], isLoading: loadingMatches } = useLeagueMatches(params.id, season)

  const isFollowing = useFollowStore(s => s.isFollowingLeague(params.id))
  const follow = useFollowStore(s => s.followLeague)
  const unfollow = useFollowStore(s => s.unfollowLeague)

  const fixtures = allMatches.filter((m: Match) => m.status === 'NS')
  const results  = allMatches.filter((m: Match) => m.status === 'FT').reverse()

  const compName = league?.name ?? allMatches[0]?.competition.name ?? `League ${params.id}`
  const compObj = {
    id: params.id,
    name: compName,
    shortName: league?.shortName ?? '',
    logoUrl: league?.logoUrl ?? allMatches[0]?.competition.logoUrl ?? null,
  }

  const loading = loadingStandings && loadingMatches

  return (
    <div style={{ padding: '24px 20px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 12, color: 'var(--text3)' }}>
        <Link href="/leagues" style={{ color: 'var(--text3)', transition: 'color 160ms ease' }}>Leagues</Link>
        <span>/</span>
        <span style={{ color: 'var(--text2)' }}>{compName}</span>
      </div>

      {/* League header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 24,
        padding: '16px',
        background: 'var(--surf)',
        border: '1px solid var(--border)',
        borderRadius: 10,
      }}>
        <CompLogo comp={compObj} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{compName}</div>
          {season && (
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
              Season {season}
            </div>
          )}
        </div>
        <FollowButton
          following={isFollowing}
          onToggle={() => isFollowing ? unfollow(params.id) : follow(params.id)}
          size="md"
        />
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {(['Standings', 'Fixtures', 'Results'] as Tab[]).map(t => (
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

      {/* Content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {tab === 'Standings' && (
          loadingStandings
            ? <div className="rl-skeleton" style={{ height: 300, borderRadius: 10 }} />
            : <div style={{ background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <LeagueTable standings={standings} />
              </div>
        )}

        {tab === 'Fixtures' && (
          loadingMatches
            ? <div className="rl-skeleton" style={{ height: 200, borderRadius: 10 }} />
            : fixtures.length
              ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {fixtures.map(m => <MatchCard key={m.id} match={m} />)}
                </div>
              : <EmptyState msg="No upcoming fixtures" />
        )}

        {tab === 'Results' && (
          loadingMatches
            ? <div className="rl-skeleton" style={{ height: 200, borderRadius: 10 }} />
            : results.length
              ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {results.map(m => <MatchCard key={m.id} match={m} />)}
                </div>
              : <EmptyState msg="No results yet" />
        )}
      </motion.div>
    </div>
  )
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
      {msg}
    </div>
  )
}
