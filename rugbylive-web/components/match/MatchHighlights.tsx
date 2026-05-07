'use client'
import type { Highlight } from '@/types'

interface Props {
  highlights: Highlight[]
}

export default function MatchHighlights({ highlights }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {highlights.map(h => (
        <a
          key={h.id}
          href={h.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            gap: 14,
            padding: 14,
            background: 'var(--surf)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            textDecoration: 'none',
            transition: 'border-color 160ms ease, background 160ms ease, transform 160ms ease',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.borderColor = 'rgba(255,255,255,0.14)'
            el.style.background = 'var(--surf2)'
            el.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.borderColor = 'var(--border)'
            el.style.background = 'var(--surf)'
            el.style.transform = 'translateY(0)'
          }}
        >
          {/* Thumbnail */}
          <div style={{
            width: 120,
            height: 68,
            borderRadius: 6,
            background: 'var(--surf3)',
            flexShrink: 0,
            overflow: 'hidden',
            position: 'relative',
          }}>
            {h.thumbnailUrl ? (
              <img
                src={h.thumbnailUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="var(--surf4)" />
                  <polygon points="10,8 18,12 10,16" fill="var(--text3)" />
                </svg>
              </div>
            )}
            {/* Play overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)',
            }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="14" fill="rgba(0,0,0,0.5)" />
                <polygon points="11,9 21,14 11,19" fill="white" />
              </svg>
            </div>
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text)',
              lineHeight: 1.4,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
            }}>
              {h.title || 'Match Highlights'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>
              {h.source}
              {h.publishedAt && ` · ${new Date(h.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
            </div>
          </div>

          {/* External link icon */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: 'var(--text3)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </div>
        </a>
      ))}
    </div>
  )
}
