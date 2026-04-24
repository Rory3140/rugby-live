'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Matches', href: '/matches' },
  { label: 'Leagues', href: '/leagues' },
  { label: 'Explore', href: '/explore' },
]

export default function Navbar() {
  const path = usePathname()

  return (
    <header className="hidden md:block" style={{
      height: 56,
      position: 'sticky',
      top: 0,
      zIndex: 40,
      width: '100%',
      background: 'rgba(21,21,32,0.72)',
      borderBottom: '1px solid var(--border)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
    }}>
      <div style={{
        maxWidth: 1120,
        margin: '0 auto',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 20px',
      }}>
        {/* Logo */}
        <Link href="/matches" style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 16, flexShrink: 0 }}>
          <div style={{
            width: 26,
            height: 18,
            borderRadius: 4,
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="13" height="9" viewBox="0 0 15 10" fill="none">
              <ellipse cx="7.5" cy="5" rx="7" ry="4" stroke="#0a0a0f" strokeWidth="1" fill="none" transform="rotate(-18 7.5 5)" />
              <line x1="5" y1="5" x2="10" y2="5" stroke="#0a0a0f" strokeWidth="0.8" />
              <line x1="6" y1="3.7" x2="6" y2="6.3" stroke="#0a0a0f" strokeWidth="0.8" />
              <line x1="7.5" y1="3.4" x2="7.5" y2="6.6" stroke="#0a0a0f" strokeWidth="0.8" />
              <line x1="9" y1="3.7" x2="9" y2="6.3" stroke="#0a0a0f" strokeWidth="0.8" />
            </svg>
          </div>
          <span className="rl-display" style={{ fontSize: 22, letterSpacing: '0.08em', lineHeight: 1, color: 'var(--text)' }}>
            RUGBY<span style={{ color: 'var(--accent)' }}>LIVE</span>
          </span>
        </Link>

        {/* Nav items — desktop only */}
        <nav className="hidden md:flex" style={{ alignItems: 'center', gap: 2, flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const active = path.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  position: 'relative',
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  color: active ? 'var(--text)' : 'var(--text2)',
                  transition: 'color 160ms ease',
                }}
              >
                {item.label}
                {active && (
                  <span style={{
                    position: 'absolute',
                    left: 14,
                    right: 14,
                    bottom: -18,
                    height: 2,
                    background: 'var(--accent)',
                    borderRadius: 2,
                  }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right icons */}
        <div className="md:hidden flex-1" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link href="/explore" style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text2)',
            transition: 'color 160ms ease',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  )
}
