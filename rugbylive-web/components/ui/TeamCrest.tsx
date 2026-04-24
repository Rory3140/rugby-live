'use client'
import { useState } from 'react'
import { hashStr, RL_COLORS } from '@/lib/utils'

interface Props {
  team: { name: string; shortName?: string; logoUrl?: string | null }
  size?: number
}

export default function TeamCrest({ team, size = 22 }: Props) {
  const [imgError, setImgError] = useState(false)
  const key = team.shortName || team.name
  const pal = RL_COLORS[hashStr(key) % RL_COLORS.length]
  const initials = team.shortName || team.name.slice(0, 3).toUpperCase()

  const base: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: 5,
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }

  if (team.logoUrl && !imgError) {
    return (
      <div style={base}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={team.logoUrl}
          alt={team.name}
          width={size}
          height={size}
          style={{ objectFit: 'contain', width: size, height: size }}
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  return (
    <div style={{ ...base, background: pal[0], border: `1px solid ${pal[1]}40` }}>
      <span style={{
        fontFamily: 'var(--font-sans)',
        fontSize: Math.round(size * 0.36),
        fontWeight: 800,
        letterSpacing: '0.02em',
        color: pal[1],
        lineHeight: 1,
      }}>
        {initials}
      </span>
    </div>
  )
}
