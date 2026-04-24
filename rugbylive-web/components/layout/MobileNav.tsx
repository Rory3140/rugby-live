'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  {
    name: 'Matches',
    href: '/matches',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    name: 'Leagues',
    href: '/leagues',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
        <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
        <path d="M10 15h4v5h-4z" />
        <path d="M8 21h8" />
      </svg>
    ),
  },
  {
    name: 'Explore',
    href: '/explore',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
  },
]

export default function MobileNav() {
  const path = usePathname()

  return (
    <nav
      className="flex md:hidden"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        background: 'var(--surf)',
        borderTop: '1px solid var(--border)',
        alignItems: 'stretch',
        zIndex: 40,
      }}
    >
      {ITEMS.map(item => {
        const active = path.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              color: active ? 'var(--accent)' : 'var(--text2)',
              minHeight: 44,
              transition: 'color 160ms ease',
            }}
          >
            {item.icon}
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 500, letterSpacing: '0.02em' }}>
              {item.name}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
