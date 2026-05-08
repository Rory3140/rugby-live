'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveScores } from '@/hooks/useLiveScores'
import DateScrubber from '@/components/matches/DateScrubber'
import FilterPills, { type FilterType } from '@/components/matches/FilterPills'
import CompGroupHeader from '@/components/matches/CompGroupHeader'
import MatchCard from '@/components/matches/MatchCard'
import { todayStr, isLive, isTerminal } from '@/lib/utils'
import { useFollowStore } from '@/store/useFollowStore'
import type { Match } from '@/types'

function getMondayOffset(): number {
  const today = new Date()
  const daysSinceMonday = (today.getDay() + 6) % 7
  return 2 - daysSinceMonday
}

function windowOffsetForDate(date: string): number {
  const d = new Date(date + 'T00:00:00')
  const daysSinceMon = (d.getDay() + 6) % 7
  const monday = new Date(d)
  monday.setDate(monday.getDate() - daysSinceMon)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.round((monday.getTime() - today.getTime()) / 86_400_000) + 2
}

export default function MatchesPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [windowOffset, setWindowOffset] = useState(getMondayOffset)
  const [filter, setFilter] = useState<FilterType>('All')
  const [animDir, setAnimDir] = useState(0)
  const prevDateRef = useRef(todayStr())
  const calendarRef = useRef<HTMLInputElement>(null)

  // Restore date from URL on mount (e.g. returning via back button)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('date')
    if (p && /^\d{4}-\d{2}-\d{2}$/.test(p) && p !== todayStr()) {
      prevDateRef.current = p
      setSelectedDate(p)
      setWindowOffset(windowOffsetForDate(p))
    }
  }, [])

  const followedLeagues = useFollowStore(s => s.followedLeagues)
  const { data: matches = [], isLoading } = useLiveScores(selectedDate)

  const filtered = useMemo(() => {
    switch (filter) {
      case 'Live':      return matches.filter(m => isLive(m.status))
      case 'Finished':  return matches.filter(m => isTerminal(m.status))
      case 'Upcoming':  return matches.filter(m => m.status === 'NS')
      default:          return matches
    }
  }, [matches, filter])

  const groups = useMemo(() => {
    const map = new Map<string, { competition: Match['competition']; matches: Match[]; round: string | null }>()
    for (const m of filtered) {
      const id = m.competition.id
      if (!map.has(id)) map.set(id, { competition: m.competition, matches: [], round: m.round })
      map.get(id)!.matches.push(m)
    }
    const earliest = (matches: Match[]) =>
      Math.min(...matches.map(m => new Date(m.kickoff).getTime()))
    return Array.from(map.values()).sort((a, b) => {
      const aF = followedLeagues.includes(a.competition.id) ? 0 : 1
      const bF = followedLeagues.includes(b.competition.id) ? 0 : 1
      if (aF !== bF) return aF - bF
      return earliest(a.matches) - earliest(b.matches)
    })
  }, [filtered, followedLeagues])

  const counts = useMemo(() => ({
    all:      matches.length,
    live:     matches.filter(m => isLive(m.status)).length,
    finished: matches.filter(m => isTerminal(m.status)).length,
    upcoming: matches.filter(m => m.status === 'NS').length,
  }), [matches])

  const isToday = selectedDate === todayStr()

  function changeDate(date: string) {
    const dir = date > prevDateRef.current ? 1 : -1
    setAnimDir(dir)
    prevDateRef.current = date
    setSelectedDate(date)
    setFilter('All')
    // Keep URL in sync — router.replace so scrubbing doesn't bloat history
    router.replace(`/matches?date=${date}`, { scroll: false })
  }

  function handlePickDate(date: string) {
    setWindowOffset(windowOffsetForDate(date))
    changeDate(date)
  }

  function stepDate(dir: 1 | -1) {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() + dir)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const today = new Date(); today.setHours(0,0,0,0)
    const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000)
    const newOffset = diff < windowOffset ? windowOffset - 1 : diff > windowOffset + 6 ? windowOffset + 1 : windowOffset
    setWindowOffset(newOffset)
    changeDate(next)
  }

  return (
    <div style={{ padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 className="rl-display" style={{ fontSize: 32, letterSpacing: '0.06em', color: 'var(--text)', lineHeight: 1 }}>
          MATCHES
        </h1>
        <div className="hidden md:block" style={{ position: 'relative' }}>
          <button
            onClick={() => calendarRef.current?.showPicker?.() ?? calendarRef.current?.click()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'var(--surf)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              cursor: 'pointer',
              padding: '7px 10px',
              transition: 'border-color 160ms ease',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 10h18M8 3v4M16 3v4" />
            </svg>
          </button>
          <input
            ref={calendarRef}
            type="date"
            value={selectedDate}
            onChange={(e) => { if (e.target.value) handlePickDate(e.target.value) }}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, pointerEvents: 'none' }}
          />
        </div>
      </div>

      {/* Date scrubber */}
      <div style={{ marginBottom: 16 }}>
        <DateScrubber
          selectedDate={selectedDate}
          windowOffset={windowOffset}
          onSelect={changeDate}
          onOffsetChange={(offset) => {
            setAnimDir(offset > windowOffset ? 1 : -1)
            setWindowOffset(offset)
          }}
          onPickDate={handlePickDate}
          onStep={stepDate}
        />
      </div>

      {/* Filter pills */}
      <div style={{ marginBottom: 24 }}>
        <FilterPills active={filter} counts={counts} onChange={setFilter} isToday={isToday} />
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[1, 2, 3].map(i => (
            <div key={i}>
              <div className="rl-skeleton" style={{ height: 20, width: 200, marginBottom: 14 }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {[1, 2, 3].map(j => (
                  <div key={j} className="rl-skeleton" style={{ height: 110, borderRadius: 10 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Competition groups — directional slide on date change */}
      {!isLoading && (
        <AnimatePresence mode="wait" custom={animDir}>
          <motion.div
            key={selectedDate + filter}
            custom={animDir}
            variants={{
              enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
              center: { opacity: 1, x: 0 },
              exit:  (dir: number) => ({ opacity: 0, x: dir * -24 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {groups.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {groups.map((group, i) => (
                  <motion.div
                    key={group.competition.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, delay: i * 0.06, ease: 'easeOut' }}
                  >
                    <CompGroupHeader
                      competition={group.competition}
                      round={group.round}
                      liveCount={group.matches.filter(m => isLive(m.status)).length}
                    />
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: 12,
                      marginBottom: 20,
                    }}>
                      {group.matches.map(match => (
                        <MatchCard key={match.id} match={match} />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text3)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🏉</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
                  No matches found
                </div>
                <div style={{ fontSize: 13 }}>
                  {filter !== 'All' ? 'Try a different filter' : 'No fixtures on this date'}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
