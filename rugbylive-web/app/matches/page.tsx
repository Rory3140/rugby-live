'use client'
import { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveScores } from '@/hooks/useLiveScores'
import DateScrubber from '@/components/matches/DateScrubber'
import FilterPills, { type FilterType } from '@/components/matches/FilterPills'
import CompGroupHeader from '@/components/matches/CompGroupHeader'
import MatchCard from '@/components/matches/MatchCard'
import { todayStr, isLive } from '@/lib/utils'
import type { Match } from '@/types'

export default function MatchesPage() {
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [windowOffset, setWindowOffset] = useState(0)
  const [filter, setFilter] = useState<FilterType>('All')
  const [animDir, setAnimDir] = useState(0)
  const prevDateRef = useRef(todayStr)

  const { data: matches = [], isLoading } = useLiveScores(selectedDate)

  const filtered = useMemo(() => {
    switch (filter) {
      case 'Live Now':  return matches.filter(m => isLive(m.status))
      case 'Finished':  return matches.filter(m => m.status === 'FT')
      case 'Upcoming':  return matches.filter(m => m.status === 'NS')
      default:          return matches
    }
  }, [matches, filter])

  const groups = useMemo(() => {
    const map = new Map<string, { competition: Match['competition']; matches: Match[]; round: string | null }>()
    for (const m of filtered) {
      const id = m.competition.id
      if (!map.has(id)) map.set(id, { competition: m.competition, matches: [], round: m.week })
      map.get(id)!.matches.push(m)
    }
    return Array.from(map.values())
  }, [filtered])

  const counts = useMemo(() => ({
    all:      matches.length,
    live:     matches.filter(m => isLive(m.status)).length,
    finished: matches.filter(m => m.status === 'FT').length,
    upcoming: matches.filter(m => m.status === 'NS').length,
  }), [matches])

  function changeDate(date: string) {
    const dir = date > prevDateRef.current ? 1 : -1
    setAnimDir(dir)
    prevDateRef.current = date
    setSelectedDate(date)
    setFilter('All')
  }

  function handlePickDate(date: string, offset: number) {
    setWindowOffset(offset)
    changeDate(date)
  }

  return (
    <div style={{ padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 className="rl-display" style={{ fontSize: 32, letterSpacing: '0.06em', color: 'var(--text)' }}>
          MATCHES
        </h1>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
          {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
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
        />
      </div>

      {/* Filter pills */}
      <div style={{ marginBottom: 24 }}>
        <FilterPills active={filter} counts={counts} onChange={setFilter} />
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
