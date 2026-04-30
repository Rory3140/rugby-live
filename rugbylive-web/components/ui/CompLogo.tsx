'use client'
import { useState } from 'react'
import { hashStr, RL_COLORS } from '@/lib/utils'

interface Props {
  comp: { name: string; shortName?: string; logoUrl?: string | null }
  size?: number
}

export default function CompLogo({ comp, size = 28 }: Props) {
  const [imgError, setImgError] = useState(false)
  const key = comp.shortName || comp.name
  const pal = RL_COLORS[hashStr(key) % RL_COLORS.length]
  const initials = (comp.shortName || comp.name).slice(0, 2).toUpperCase()

  const base: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: 999,
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }

  if (comp.logoUrl && !imgError) {
    return (
      <div style={{ ...base, background: 'var(--surf3)', border: '1px solid var(--border)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={comp.logoUrl}
          alt={comp.name}
          width={size - 6}
          height={size - 6}
          style={{ objectFit: 'contain', width: size - 6, height: size - 6 }}
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  return (
    <div style={{
      ...base,
      background: 'var(--surf3)',
      border: '1px solid var(--border)',
      color: pal[1],
      fontSize: Math.round(size * 0.32),
      fontWeight: 800,
      letterSpacing: '0.04em',
      fontFamily: 'var(--font-sans)',
    }}>
      {initials}
    </div>
  )
}
