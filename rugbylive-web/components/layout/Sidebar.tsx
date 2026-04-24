'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import CompLogo from '@/components/ui/CompLogo'
import { useLeagues } from '@/hooks/useLeagues'

const SECTIONS = [
  {
    label: 'International',
    ids: ['51', '85', '93', '86'],
  },
  {
    label: 'Club',
    ids: ['76', '13', '16', '71', '54', '17'],
  },
]

export default function Sidebar() {
  const path = usePathname()
  const { data: leagues = [] } = useLeagues()

  return (
    <aside
      className="hidden md:flex"
      style={{
        width: 220,
        flexShrink: 0,
        flexDirection: 'column',
        gap: 22,
        padding: '20px 16px 24px',
        borderRight: '1px solid var(--border)',
        background: 'var(--bg)',
        position: 'sticky',
        top: 56,
        height: 'calc(100vh - 56px)',
        overflowY: 'auto',
      }}
    >
      {SECTIONS.map(section => {
        const items = section.ids
          .map(id => leagues.find(l => l.id === id))
          .filter(Boolean) as typeof leagues

        if (items.length === 0) return null

        return (
          <div key={section.label}>
            <div className="rl-label" style={{ padding: '0 8px', marginBottom: 8 }}>
              {section.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {items.map(item => {
                const active = path === `/leagues/${item.id}`
                return (
                  <Link
                    key={item.id}
                    href={`/leagues/${item.id}`}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 8px',
                      borderRadius: 6,
                      fontSize: 13,
                      color: active ? 'var(--text)' : 'var(--text2)',
                      fontWeight: active ? 600 : 500,
                      background: active ? 'var(--accent2)' : 'transparent',
                      transition: 'background 160ms ease, color 160ms ease',
                    }}
                  >
                    {active && (
                      <span style={{
                        position: 'absolute',
                        left: -16,
                        top: 6,
                        bottom: 6,
                        width: 2,
                        background: 'var(--accent)',
                        borderRadius: 2,
                      }} />
                    )}
                    <CompLogo comp={item} size={20} />
                    <span style={{
                      flex: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </aside>
  )
}
