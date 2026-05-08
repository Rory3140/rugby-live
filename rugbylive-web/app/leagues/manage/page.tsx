'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'

interface AdminLeague {
  id: string
  name: string
  country: string | null
  logoUrl: string | null
  active: boolean
  category: string | null
}

interface AdminTeam {
  id: string            // as_team_XXXX
  firestoreId: string | null
  name: string
  shortName: string
  logoUrl: string | null
  customLogoUrl: string | null
  asLogoUrl: string | null
}

const CATEGORIES = ['International', 'Club', 'Sevens'] as const
const ORDER = ['International', 'Club', 'Sevens']
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

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

function asTeamNumericId(id: string): string | null {
  const m = id.match(/^as_team_(\d+)$/)
  return m ? m[1] : null
}

// ── Logo upload button ──────────────────────────────────────────────────────

function LogoUploadBtn({
  url, onUpload, size = 28,
}: {
  url: string | null
  onUpload: (file: File) => Promise<void>
  size?: number
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try { await onUpload(file) } finally {
      setUploading(false)
      if (ref.current) ref.current.value = ''
    }
  }

  return (
    <div
      style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
      title="Click to upload logo"
      onClick={() => !uploading && ref.current?.click()}
    >
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleChange} />
      <div style={{
        width: size, height: size, borderRadius: 6, overflow: 'hidden',
        border: '1px solid var(--border)', background: 'var(--surf3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: uploading ? 0.5 : 1, transition: 'opacity 160ms',
      }}>
        {url
          ? <img src={url} alt="" width={size - 6} height={size - 6} style={{ objectFit: 'contain', width: size - 6, height: size - 6 }} />
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        }
      </div>
      {uploading && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />
        </div>
      )}
    </div>
  )
}

// ── Team row ────────────────────────────────────────────────────────────────

function TeamRow({ team, onUpdated }: {
  team: AdminTeam
  onUpdated: (updated: Partial<AdminTeam>) => void
}) {
  const numericId = asTeamNumericId(team.id)
  const [name, setName] = useState(team.name)
  const [shortName, setShortName] = useState(team.shortName)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const dirty = name !== team.name || shortName !== team.shortName

  async function uploadLogo(file: File) {
    if (!numericId) return
    const form = new FormData()
    form.append('logo', file)
    const res = await fetch(`${API}/admin/teams/${numericId}/logo`, { method: 'POST', body: form })
    const j = await res.json()
    if (j.url) onUpdated({ logoUrl: j.url, customLogoUrl: j.url })
  }

  async function save() {
    if (!numericId || !dirty) return
    setSaving(true)
    try {
      const res = await fetch(`${API}/admin/teams/${numericId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, shortName }),
      })
      if (res.ok) {
        onUpdated({ name, shortName })
        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
      }
    } finally { setSaving(false) }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 16px',
      borderBottom: '1px solid var(--border2)',
    }}>
      <LogoUploadBtn url={team.logoUrl} onUpload={uploadLogo} size={28} />

      <input
        value={name}
        onChange={e => setName(e.target.value)}
        style={{
          flex: 1, minWidth: 0, height: 30, padding: '0 8px',
          borderRadius: 6, border: `1px solid ${dirty ? 'var(--accent)' : 'var(--border)'}`,
          background: 'var(--surf2)', color: 'var(--text)', fontSize: 13,
          fontFamily: 'var(--font-sans)', outline: 'none',
        }}
      />

      <input
        value={shortName}
        onChange={e => setShortName(e.target.value.slice(0, 3).toUpperCase())}
        placeholder="ABC"
        style={{
          width: 52, height: 30, padding: '0 6px',
          borderRadius: 6, border: `1px solid ${dirty ? 'var(--accent)' : 'var(--border)'}`,
          background: 'var(--surf2)', color: 'var(--text)', fontSize: 12,
          fontFamily: 'var(--font-mono)', textAlign: 'center', outline: 'none',
        }}
      />

      <button
        onClick={save}
        disabled={!dirty || saving}
        style={{
          flexShrink: 0, height: 30, padding: '0 12px',
          borderRadius: 6, border: '1px solid var(--border)',
          background: saved ? 'var(--accent2)' : dirty ? 'var(--surf3)' : 'transparent',
          color: saved ? 'var(--accent)' : dirty ? 'var(--text)' : 'var(--text3)',
          fontSize: 11, fontWeight: 600, cursor: dirty && !saving ? 'pointer' : 'default',
          fontFamily: 'var(--font-sans)', transition: 'all 160ms',
          opacity: saving ? 0.5 : 1,
        }}
      >
        {saved ? '✓ Saved' : saving ? '…' : 'Save'}
      </button>
    </div>
  )
}

// ── League row ──────────────────────────────────────────────────────────────

function LeagueRow({
  league, isLast, onUpdate,
}: {
  league: AdminLeague
  isLast: boolean
  onUpdate: (id: string, patch: Partial<AdminLeague>) => void
}) {
  const [pending, setPending] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [teams, setTeams] = useState<AdminTeam[]>([])
  const [teamsLoading, setTeamsLoading] = useState(false)

  async function toggle() {
    setPending(true)
    try {
      const res = await fetch(`${API}/admin/leagues/${league.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !league.active }),
      })
      if (res.ok) onUpdate(league.id, { active: !league.active })
    } finally { setPending(false) }
  }

  async function changeCategory(category: string | null) {
    const prev = league.category
    onUpdate(league.id, { category })
    try {
      const res = await fetch(`${API}/admin/leagues/${league.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      })
      if (!res.ok) onUpdate(league.id, { category: prev })
    } catch {
      onUpdate(league.id, { category: prev })
    }
  }

  async function uploadLeagueLogo(file: File) {
    const form = new FormData()
    form.append('logo', file)
    const res = await fetch(`${API}/admin/leagues/${league.id}/logo`, { method: 'POST', body: form })
    const j = await res.json()
    if (j.url) onUpdate(league.id, { logoUrl: j.url })
  }

  async function expandTeams() {
    if (expanded) { setExpanded(false); return }
    setExpanded(true)
    if (teams.length > 0) return
    setTeamsLoading(true)
    try {
      const res = await fetch(`${API}/admin/leagues/${league.id}/teams`)
      const j = await res.json()
      setTeams(j.data ?? [])
    } finally { setTeamsLoading(false) }
  }

  function updateTeam(teamId: string, patch: Partial<AdminTeam>) {
    setTeams(ts => ts.map(t => t.id === teamId ? { ...t, ...patch } : t))
  }

  return (
    <div style={{
      borderBottom: isLast ? 'none' : '1px solid var(--border2)',
      opacity: league.active ? 1 : 0.45,
      transition: 'opacity 160ms',
    }}>
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px' }}>
        <LogoUploadBtn url={league.logoUrl} onUpload={uploadLeagueLogo} size={28} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {league.name}
          </div>
          {displayCountry(league.country) && (
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{displayCountry(league.country)}</div>
          )}
        </div>

        {/* Teams toggle */}
        <button
          onClick={expandTeams}
          style={{
            flexShrink: 0, height: 26, padding: '0 8px',
            borderRadius: 6, border: '1px solid var(--border)',
            background: expanded ? 'var(--surf3)' : 'transparent',
            color: 'var(--text3)', fontSize: 11, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 160ms' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
          Teams
        </button>

        {/* Category picker */}
        <select
          value={league.category ?? ''}
          onChange={e => changeCategory(e.target.value || null)}
          style={{
            flexShrink: 0, height: 26, padding: '0 6px',
            borderRadius: 6, border: '1px solid var(--border)',
            background: 'var(--surf3)',
            color: league.category ? 'var(--text)' : 'var(--text3)',
            fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)',
            cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="">Auto ({autoCategory(league)})</option>
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        {/* Active toggle */}
        <button
          onClick={toggle}
          disabled={pending}
          style={{
            flexShrink: 0, width: 44, height: 24, borderRadius: 999,
            border: 'none',
            background: league.active ? 'var(--accent)' : 'var(--surf3)',
            position: 'relative', cursor: pending ? 'wait' : 'pointer',
            transition: 'background 200ms', opacity: pending ? 0.6 : 1,
          }}
        >
          <span style={{
            position: 'absolute', top: 3,
            left: league.active ? 23 : 3,
            width: 18, height: 18, borderRadius: '50%',
            background: league.active ? 'var(--bg)' : 'var(--text3)',
            transition: 'left 200ms',
          }} />
        </button>
      </div>

      {/* Teams panel */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border2)', background: 'var(--bg)' }}>
          {teamsLoading && (
            <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text3)' }}>Loading teams…</div>
          )}
          {!teamsLoading && teams.length === 0 && (
            <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text3)' }}>No team data available.</div>
          )}
          {!teamsLoading && teams.map(t => (
            <TeamRow key={t.id} team={t} onUpdated={patch => updateTeam(t.id, patch)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function ManageLeaguesPage() {
  const [leagues, setLeagues] = useState<AdminLeague[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch(`${API}/admin/leagues`)
      .then(r => r.json())
      .then(j => setLeagues(j.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  function updateLeague(id: string, patch: Partial<AdminLeague>) {
    setLeagues(ls => ls.map(l => l.id === id ? { ...l, ...patch } : l))
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
    <div style={{ padding: '24px 20px', maxWidth: 700 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 12, color: 'var(--text3)' }}>
        <Link href="/leagues" style={{ color: 'var(--text3)' }}>Leagues</Link>
        <span>/</span>
        <span style={{ color: 'var(--text2)' }}>Manage</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <h1 className="rl-display" style={{ fontSize: 28, letterSpacing: '0.06em' }}>MANAGE LEAGUES</h1>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{activeCount} of {leagues.length} active</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.5 }}>
        Click a logo to upload a custom image. Expand teams to rename or upload team logos.
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
            width: '100%', height: 40, padding: '0 14px 0 38px',
            borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surf)',
            color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)',
          }}
        />
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="rl-skeleton" style={{ height: 52, borderRadius: 8 }} />
          ))}
        </div>
      )}

      {!loading && sections.map(section => (
        <div key={section} style={{ marginBottom: 28 }}>
          <div className="rl-label" style={{ marginBottom: 10, paddingLeft: 4 }}>{section}</div>
          <div style={{ background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {(grouped.get(section) ?? []).map((league, i, arr) => (
              <LeagueRow
                key={league.id}
                league={league}
                isLast={i === arr.length - 1}
                onUpdate={updateLeague}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
