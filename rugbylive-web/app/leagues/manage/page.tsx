'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import CompLogo from '@/components/ui/CompLogo'

interface AdminLeague {
  id: string
  name: string
  country: string | null
  logoUrl: string | null
  active: boolean
  category: string | null
  type?: string
}

const CATEGORIES = ['International', 'Club', 'Sevens'] as const

function autoCategory(league: AdminLeague): string {
  const name = league.name.toLowerCase()
  const country = (league.country ?? '').toLowerCase()
  if (name.includes('seven') || name.includes('7s')) return 'Sevens'
  if (!country || country === 'world') return 'International'
  return 'Club'
}

function categorise(league: AdminLeague): string {
  return league.category ?? autoCategory(league)
}

function displayCountry(country: string | null): string | null {
  if (!country) return null
  return country === 'World' ? 'International' : country
}

const ORDER = ['International', 'Club', 'Sevens']
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export default function ManageLeaguesPage() {
  const [leagues, setLeagues] = useState<AdminLeague[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pending, setPending] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch(`${API}/admin/leagues`)
      .then(r => r.json())
      .then(j => setLeagues(j.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function toggle(id: string, current: boolean) {
    setPending(s => new Set(s).add(id))
    try {
      const res = await fetch(`${API}/admin/leagues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !current }),
      })
      if (res.ok) {
        setLeagues(ls => ls.map(l => l.id === id ? { ...l, active: !current } : l))
      }
    } finally {
      setPending(s => { const n = new Set(s); n.delete(id); return n })
    }
  }

  async function changeCategory(id: string, category: string | null) {
    // Optimistic — re-group immediately, revert on failure
    const prev = leagues.find(l => l.id === id)?.category ?? null
    setLeagues(ls => ls.map(l => l.id === id ? { ...l, category } : l))
    try {
      const res = await fetch(`${API}/admin/leagues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      })
      if (!res.ok) {
        setLeagues(ls => ls.map(l => l.id === id ? { ...l, category: prev } : l))
      }
    } catch {
      setLeagues(ls => ls.map(l => l.id === id ? { ...l, category: prev } : l))
    }
  }

  const filtered = useMemo(() =>
    search.trim() ? leagues.filter(l => l.name.toLowerCase().includes(search.toLowerCase())) : leagues,
    [leagues, search]
  )

  const grouped = useMemo(() => {
    const sort = (arr: AdminLeague[]) => [...arr].sort((a, b) => a.name.localeCompare(b.name))
    if (search.trim()) return new Map([['Results', sort(filtered)]])
    const map = new Map<string, AdminLeague[]>()
    for (const l of filtered) {
      const cat = categorise(l)
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(l)
    }
    Array.from(map.entries()).forEach(([key, val]) => map.set(key, sort(val)))
    return map
  }, [filtered, search])

  const sections = search.trim() ? ['Results'] : ORDER.filter(k => grouped.has(k))
  const activeCount = leagues.filter(l => l.active).length

  return (
    <div style={{ padding: '24px 20px', maxWidth: 640 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 12, color: 'var(--text3)' }}>
        <Link href="/leagues" style={{ color: 'var(--text3)' }}>Leagues</Link>
        <span>/</span>
        <span style={{ color: 'var(--text2)' }}>Manage</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <h1 className="rl-display" style={{ fontSize: 28, letterSpacing: '0.06em' }}>MANAGE LEAGUES</h1>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
          {activeCount} of {leagues.length} active
        </span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24, lineHeight: 1.5 }}>
        Inactive leagues are hidden from the matches feed for everyone. Saved to Firestore.
      </p>

      <div style={{ position: 'relative', marginBottom: 24 }}>
        <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }}
          width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="text"
          placeholder="Search leagues…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', height: 44, padding: '0 14px 0 38px',
            borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surf)',
            color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-sans)',
          }}
        />
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="rl-skeleton" style={{ height: 60, borderRadius: 8 }} />
          ))}
        </div>
      )}

      {!loading && sections.map(section => (
        <div key={section} style={{ marginBottom: 28 }}>
          <div className="rl-label" style={{ marginBottom: 10, paddingLeft: 4 }}>{section}</div>
          <div style={{ background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {(grouped.get(section) ?? []).map((league, i, arr) => (
              <div
                key={league.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border2)' : 'none',
                  opacity: league.active ? 1 : 0.4,
                  transition: 'opacity 160ms ease',
                }}
              >
                <CompLogo comp={league} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {league.name}
                  </div>
                  {displayCountry(league.country) && (
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{displayCountry(league.country)}</div>
                  )}
                </div>

                {/* Category picker */}
                <select
                  value={league.category ?? ''}
                  disabled={pending.has(league.id + '_cat')}
                  onChange={e => changeCategory(league.id, e.target.value || null)}
                  style={{
                    flexShrink: 0,
                    height: 28,
                    padding: '0 6px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--surf3)',
                    color: league.category ? 'var(--text)' : 'var(--text3)',
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: 'var(--font-sans)',
                    cursor: 'pointer',
                    outline: 'none',
                    opacity: pending.has(league.id + '_cat') ? 0.5 : 1,
                  }}
                >
                  <option value="">Auto ({autoCategory(league)})</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Active toggle */}
                <button
                  onClick={() => toggle(league.id, league.active)}
                  disabled={pending.has(league.id)}
                  style={{
                    flexShrink: 0,
                    width: 44,
                    height: 24,
                    borderRadius: 999,
                    border: 'none',
                    background: league.active ? 'var(--accent)' : 'var(--surf3)',
                    position: 'relative',
                    cursor: pending.has(league.id) ? 'wait' : 'pointer',
                    transition: 'background 200ms ease',
                    opacity: pending.has(league.id) ? 0.6 : 1,
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: 3,
                    left: league.active ? 23 : 3,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: league.active ? 'var(--bg)' : 'var(--text3)',
                    transition: 'left 200ms ease',
                  }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
