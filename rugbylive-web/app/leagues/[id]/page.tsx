'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useStandings, useLeagueMatches } from '@/hooks/useStandings'
import { isTerminal } from '@/lib/utils'
import { useLeague, useLeagueSeasons } from '@/hooks/useLeagues'
import { useFollowStore } from '@/store/useFollowStore'
import LeagueTable from '@/components/leagues/LeagueTable'
import MatchCard from '@/components/matches/MatchCard'
import CompLogo from '@/components/ui/CompLogo'
import FollowButton from '@/components/ui/FollowButton'
import type { Match } from '@/types'

type Tab = 'Standings' | 'Fixtures' | 'Results'

export default function LeaguePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('Standings')

  const { data: league } = useLeague(params.id)

  // Fetch seasons dynamically — picks the most recent (index 0, sorted newest first by API)
  const { data: seasons = [], isLoading: loadingSeasons } = useLeagueSeasons(params.id)
  const currentSeason = seasons.find(s => s.current) ?? seasons[0] ?? null
  const seasonId = currentSeason?.id

  const { data: standings = [], isLoading: loadingStandings } = useStandings(params.id, seasonId)
  const { data: allMatches = [], isLoading: loadingMatches } = useLeagueMatches(params.id, seasonId)

  const isFollowing = useFollowStore(s => s.isFollowingLeague(params.id))
  const follow = useFollowStore(s => s.followLeague)
  const unfollow = useFollowStore(s => s.unfollowLeague)

  const fixtures = allMatches.filter((m: Match) => m.status === 'NS')
  const results  = allMatches.filter((m: Match) => isTerminal(m.status)).reverse()

  const compName = league?.name ?? allMatches[0]?.competition.name ?? `League ${params.id}`
  const compObj = {
    id: params.id,
    name: compName,
    shortName: league?.shortName ?? '',
    logoUrl: league?.logoUrl ?? allMatches[0]?.competition.logoUrl ?? null,
  }

  const loading = loadingSeasons || (loadingStandings && loadingMatches)

  return (
    <div style={{ padding: '24px 20px' }}>
      {/* Back button */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 32, padding: '0 12px',
            borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--surf)', color: 'var(--text2)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            transition: 'border-color 160ms ease, color 160ms ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>
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
          {currentSeason && (
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
              {currentSeason.name}
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
          loading
            ? <div className="rl-skeleton" style={{ height: 300, borderRadius: 10 }} />
            : standings.length > 0
              ? <div style={{ background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <LeagueTable standings={standings} />
                </div>
              : <EmptyState msg="No standings available" />
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
