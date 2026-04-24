'use client'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useLeagues } from '@/hooks/useLeagues'
import { useFollowStore } from '@/store/useFollowStore'
import CompLogo from '@/components/ui/CompLogo'
import FollowButton from '@/components/ui/FollowButton'
import type { League } from '@/types'

function categorise(league: League): string {
  const name = league.name.toLowerCase()
  const country = (league.country ?? '').toLowerCase()

  if (name.includes('seven') || name.includes('7s')) return 'Sevens'

  const international = ['world', '']
  if (!country || international.includes(country)) return 'International'

  const southern = ['new zealand', 'australia', 'south africa', 'argentina', 'japan', 'fiji', 'samoa', 'tonga', 'namibia', 'pacific', 'americas']
  if (southern.some(c => country.includes(c))) return 'Southern Hemisphere'

  return 'Northern Hemisphere'
}

const ORDER = ['International', 'Northern Hemisphere', 'Southern Hemisphere', 'Sevens']

export default function LeaguesPage() {
  const [search, setSearch] = useState('')
  const { data: leagues = [], isLoading } = useLeagues()
  const isFollowing = useFollowStore(s => s.isFollowingLeague)
  const follow = useFollowStore(s => s.followLeague)
  const unfollow = useFollowStore(s => s.unfollowLeague)

  const filtered = useMemo(() =>
    search.trim()
      ? leagues.filter(l => l.name.toLowerCase().includes(search.toLowerCase()))
      : leagues,
    [leagues, search]
  )

  const grouped = useMemo(() => {
    if (search.trim()) return new Map([['Results', filtered]])
    const map = new Map<string, League[]>()
    for (const l of filtered) {
      const cat = categorise(l)
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(l)
    }
    return map
  }, [filtered, search])

  const sections = search.trim()
    ? ['Results']
    : ORDER.filter(k => grouped.has(k))

  return (
    <div style={{ padding: '24px 20px' }}>
      <h1 className="rl-display" style={{ fontSize: 32, letterSpacing: '0.06em', marginBottom: 20 }}>
        LEAGUES
      </h1>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 28 }}>
        <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="text"
          placeholder="Search competitions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            height: 44,
            padding: '0 14px 0 38px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--surf)',
            color: 'var(--text)',
            fontSize: 14,
            outline: 'none',
            fontFamily: 'var(--font-sans)',
          }}
        />
      </div>

      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="rl-skeleton" style={{ height: 52, borderRadius: 8 }} />
          ))}
        </div>
      )}

      {!isLoading && sections.map((section, si) => (
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: si * 0.06, ease: 'easeOut' }}
          style={{ marginBottom: 28 }}
        >
          <div className="rl-label" style={{ marginBottom: 10, paddingLeft: 4 }}>{section}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(grouped.get(section) ?? []).map(league => (
              <div key={league.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid transparent',
                transition: 'background 160ms ease, border-color 160ms ease',
                cursor: 'pointer',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.background = 'var(--surf)'
                  ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'
                }}
              >
                <Link href={`/leagues/${league.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <CompLogo comp={league} size={32} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {league.name}
                    </div>
                    {league.country && (
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{league.country}</div>
                    )}
                  </div>
                </Link>
                <FollowButton
                  following={isFollowing(league.id)}
                  onToggle={() => isFollowing(league.id) ? unfollow(league.id) : follow(league.id)}
                />
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {!isLoading && filtered.length === 0 && search.trim() && (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
          No competitions found for &ldquo;{search}&rdquo;
        </div>
      )}
    </div>
  )
}
