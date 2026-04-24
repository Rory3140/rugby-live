'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useLeagues } from '@/hooks/useLeagues'
import { useFollowStore } from '@/store/useFollowStore'
import CompLogo from '@/components/ui/CompLogo'
import FollowButton from '@/components/ui/FollowButton'

export default function ExplorePage() {
  const [search, setSearch] = useState('')
  const { data: leagues = [], isLoading } = useLeagues()
  const isFollowing = useFollowStore(s => s.isFollowingLeague)
  const follow = useFollowStore(s => s.followLeague)
  const unfollow = useFollowStore(s => s.unfollowLeague)

  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return leagues.filter(l => l.name.toLowerCase().includes(q) || (l.country ?? '').toLowerCase().includes(q))
  }, [leagues, search])

  return (
    <div style={{ padding: '24px 20px' }}>
      <h1 className="rl-display" style={{ fontSize: 32, letterSpacing: '0.06em', marginBottom: 20 }}>
        EXPLORE
      </h1>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }}
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          autoFocus
          type="text"
          placeholder="Search competitions and teams…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            height: 48,
            padding: '0 16px 0 44px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--surf)',
            color: 'var(--text)',
            fontSize: 15,
            outline: 'none',
            fontFamily: 'var(--font-sans)',
            transition: 'border-color 160ms ease',
          }}
          onFocus={e => (e.target.style.borderColor = 'rgba(255,255,255,0.18)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
      </div>

      {/* Results */}
      {search.trim() && (
        <div>
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3].map(i => <div key={i} className="rl-skeleton" style={{ height: 52, borderRadius: 8 }} />)}
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div>
              <div className="rl-label" style={{ marginBottom: 10 }}>Competitions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {results.map(league => (
                  <div key={league.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid transparent',
                    transition: 'background 160ms ease, border-color 160ms ease',
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
            </div>
          )}

          {!isLoading && results.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              No results for &ldquo;{search}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* Empty prompt */}
      {!search.trim() && (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>
            Search for competitions by name or country
          </div>
        </div>
      )}
    </div>
  )
}
