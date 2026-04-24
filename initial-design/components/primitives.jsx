// RugbyLive primitive components: TeamCrest, CompLogo, LiveBadge, FollowButton, ScorerPills, Icons

const RL_COLORS = [
  ['#1e40af','#60a5fa'], // blue
  ['#14532d','#4ade80'], // green
  ['#7f1d1d','#fca5a5'], // red
  ['#451a03','#fbbf24'], // amber
  ['#3b0764','#c4b5fd'], // purple
  ['#134e4a','#5eead4'], // teal
  ['#1f2937','#9ca3af'], // slate
  ['#581c87','#e9d5ff'], // violet
  ['#7c2d12','#fb923c'], // orange
  ['#164e63','#67e8f9'], // cyan
];
function hashStr(s){ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return Math.abs(h); }

function TeamCrest({ team, size = 22 }) {
  // Shield-shaped crest with monogram. Mimics fallback "3-letter abbreviation" card pattern.
  const pal = RL_COLORS[hashStr(team.shortName || team.name) % RL_COLORS.length];
  const initials = team.shortName || (team.name || '??').slice(0,3).toUpperCase();
  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: 5,
        background: pal[0],
        border: `1px solid ${pal[1]}40`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flex: '0 0 auto',
      }}
    >
      <span style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: Math.round(size * 0.36),
        fontWeight: 800,
        letterSpacing: '0.02em',
        color: pal[1],
      }}>{initials}</span>
    </div>
  );
}

function CompLogo({ comp, size = 28 }) {
  const pal = RL_COLORS[hashStr(comp.shortName || comp.name) % RL_COLORS.length];
  const initials = (comp.shortName || comp.name).slice(0,2).toUpperCase();
  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: 999,
        background: 'var(--surf3)',
        border: `1px solid var(--border)`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flex: '0 0 auto',
        color: pal[1],
        fontFamily: 'DM Sans, sans-serif',
        fontSize: Math.round(size * 0.32),
        fontWeight: 800,
        letterSpacing: '0.04em',
      }}
    >{initials}</div>
  );
}

function LiveBadge({ clock = "58'" }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 8px 3px 7px',
      borderRadius: 999,
      background: 'var(--live2)',
      color: 'var(--live)',
      fontFamily: 'DM Mono, monospace',
      fontSize: 11, fontWeight: 600,
      letterSpacing: '0.02em',
    }}>
      <span className="rl-live-dot" />
      <span>{clock}</span>
    </span>
  );
}

function StatusBadge({ status, clock, kickoff }) {
  if (status === 'live' || status === 'halftime') return <LiveBadge clock={status === 'halftime' ? 'HT' : clock} />;
  if (status === 'finished') return (
    <span className="rl-mono" style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.08em' }}>FT</span>
  );
  return (
    <span className="rl-mono" style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>{kickoff}</span>
  );
}

function FollowButton({ following, onClick, size = 'sm' }) {
  return (
    <button className="rl-follow" data-active={following} onClick={onClick}
      style={{ padding: size === 'md' ? '8px 14px' : '6px 10px', fontSize: size === 'md' ? 12 : 11 }}>
      {following ? 'Following' : '+ Follow'}
    </button>
  );
}

function RugbyBall({ size = 10, color = 'var(--text2)' }) {
  // tiny iconographic rugby ball (ellipse + 3 laces)
  return (
    <svg width={size * 1.5} height={size} viewBox="0 0 15 10" fill="none" style={{ flex: '0 0 auto' }}>
      <ellipse cx="7.5" cy="5" rx="7" ry="4" stroke={color} strokeWidth="1" fill="none" transform="rotate(-18 7.5 5)" />
      <line x1="5" y1="5" x2="10" y2="5" stroke={color} strokeWidth="0.8" />
      <line x1="6" y1="3.7" x2="6" y2="6.3" stroke={color} strokeWidth="0.8" />
      <line x1="7.5" y1="3.4" x2="7.5" y2="6.6" stroke={color} strokeWidth="0.8" />
      <line x1="9" y1="3.7" x2="9" y2="6.3" stroke={color} strokeWidth="0.8" />
    </svg>
  );
}

function ScorerPills({ scorers = [] }) {
  if (!scorers.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
      {scorers.map((s, i) => (
        <span key={i} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 8px',
          borderRadius: 999,
          background: 'var(--surf3)',
          border: '1px solid var(--border)',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 11,
          color: 'var(--text2)',
        }}>
          <RugbyBall size={9} color={s.card === 'yellow' ? '#facc15' : s.card === 'red' ? 'var(--live)' : 'var(--text2)'} />
          <span style={{ color: 'var(--text)' }}>{s.player}</span>
          <span className="rl-mono" style={{ color: 'var(--text3)', fontSize: 10 }}>{s.minute}'</span>
        </span>
      ))}
    </div>
  );
}

/* Minimal inline icons (to avoid Lucide runtime dep) — stroke 1.6, size 18 default */
function Icon({ d, size = 18, stroke = 'currentColor', strokeWidth = 1.6, fill = 'none' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ flex: '0 0 auto' }}>
      {d}
    </svg>
  );
}
const I = {
  search:   <Icon d={<g><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></g>} />,
  bell:     <Icon d={<g><path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/></g>} />,
  chevL:    <Icon d={<path d="m14 6-6 6 6 6"/>} />,
  chevR:    <Icon d={<path d="m10 6 6 6-6 6"/>} />,
  calendar: <Icon d={<g><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></g>} />,
  trophy:   <Icon d={<g><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/><path d="M10 15h4v5h-4z"/><path d="M8 21h8"/></g>} />,
  users:    <Icon d={<g><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11"/></g>} />,
  compass:  <Icon d={<g><circle cx="12" cy="12" r="9"/><path d="m15 9-2 6-6 2 2-6 6-2Z"/></g>} />,
  filter:   <Icon d={<path d="M3 5h18M6 12h12M10 19h4"/>} />,
  flag:     <Icon d={<g><path d="M4 22V4M4 4h14l-2 4 2 4H4"/></g>} />,
  whistle:  <Icon d={<g><circle cx="8" cy="14" r="5"/><path d="M13 12V6h8"/><path d="M17 6v3"/></g>} />,
  close:    <Icon d={<g><path d="M6 6 18 18M18 6 6 18"/></g>} />,
};

/* Export to window so other <script type="text/babel"> files can use them */
Object.assign(window, {
  TeamCrest, CompLogo, LiveBadge, StatusBadge, FollowButton,
  ScorerPills, RugbyBall, Icon, I, hashStr,
});
