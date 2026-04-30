'use client'

interface Props {
  following: boolean
  onToggle: () => void
  size?: 'sm' | 'md'
}

export default function FollowButton({ following, onToggle, size = 'sm' }: Props) {
  return (
    <button
      className="rl-follow"
      data-active={String(following)}
      onClick={(e) => { e.stopPropagation(); onToggle() }}
      style={size === 'md' ? { padding: '8px 14px', fontSize: 12 } : undefined}
    >
      {following ? 'Following' : '+ Follow'}
    </button>
  )
}
