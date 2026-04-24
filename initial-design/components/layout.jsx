// Navbar, Sidebar, MobileNav, DateScrubber, FilterPills, CompGroupHeader, MatchCard

function Navbar({ active = 'Matches' }) {
  const items = ['Matches', 'Leagues', 'Teams', 'Explore'];
  return (
    <div style={{
      height: 56, width: '100%',
      background: 'rgba(21,21,32,0.72)',
      borderBottom: '1px solid var(--border)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      display: 'flex', alignItems: 'center', gap: 32,
      padding: '0 24px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 26, height: 18, borderRadius: 4,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <RugbyBall size={10} color="#0a0a0f" />
        </div>
        <span className="rl-display" style={{ fontSize: 22, letterSpacing: '0.08em', lineHeight: 1, color: 'var(--text)' }}>
          RUGBY<span style={{ color: 'var(--accent)' }}>LIVE</span>
        </span>
      </div>

      {/* Nav items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
        {items.map(i => {
          const on = i === active;
          return (
            <div key={i} style={{
              position: 'relative',
              padding: '8px 14px',
              fontSize: 13, fontWeight: on ? 600 : 500,
              color: on ? 'var(--text)' : 'var(--text2)',
              cursor: 'pointer',
            }}>
              {i}
              {on && <div style={{
                position: 'absolute', left: 14, right: 14, bottom: -18,
                height: 2, background: 'var(--accent)',
              }} />}
            </div>
          );
        })}
      </div>

      {/* Right icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button style={iconBtnStyle}>{I.search}</button>
        <button style={iconBtnStyle}>
          {I.bell}
          <span style={{
            position: 'absolute', top: 8, right: 8,
            width: 6, height: 6, borderRadius: 999,
            background: 'var(--live)',
          }} />
        </button>
      </div>
    </div>
  );
}
const iconBtnStyle = {
  position: 'relative',
  width: 36, height: 36, borderRadius: 8,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--text2)',
};

function Sidebar() {
  const sections = [
    { label: 'Live Now', items: [
      { name: 'Six Nations', live: true },
      { name: 'URC',         live: true },
    ]},
    { label: 'International', items: [
      { name: 'Six Nations',            active: true },
      { name: 'Rugby Championship' },
      { name: 'World Cup' },
      { name: 'World Sevens Series' },
    ]},
    { label: 'Club', items: [
      { name: 'United Rugby Championship' },
      { name: 'Gallagher Premiership' },
      { name: 'Top 14' },
      { name: 'Super Rugby Pacific' },
      { name: 'Champions Cup' },
    ]},
  ];
  return (
    <div style={{
      width: 220,
      padding: '20px 16px 24px',
      borderRight: '1px solid var(--border)',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', gap: 22,
    }}>
      {sections.map(s => (
        <div key={s.label}>
          <div className="rl-label" style={{ padding: '0 8px', marginBottom: 8 }}>{s.label}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {s.items.map(it => (
              <div key={it.name} style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 8px',
                borderRadius: 6,
                fontSize: 13,
                color: it.active ? 'var(--text)' : 'var(--text2)',
                fontWeight: it.active ? 600 : 500,
                background: it.active ? 'var(--accent2)' : 'transparent',
                cursor: 'pointer',
              }}>
                {it.active && <div style={{
                  position: 'absolute', left: -16, top: 6, bottom: 6, width: 2,
                  background: 'var(--accent)', borderRadius: 2,
                }} />}
                <CompLogo comp={{ name: it.name, shortName: it.name.split(' ').map(w=>w[0]).join('').slice(0,2) }} size={20} />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</span>
                {it.live && <span className="rl-live-dot" />}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MobileNav({ active = 'Matches' }) {
  const items = [
    { name: 'Matches',  icon: I.calendar },
    { name: 'Leagues',  icon: I.trophy },
    { name: 'Teams',    icon: I.users },
    { name: 'Explore',  icon: I.search },
    { name: 'Alerts',   icon: I.bell },
  ];
  return (
    <div style={{
      width: '100%', height: 64,
      background: 'var(--surf)',
      borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'stretch',
    }}>
      {items.map(it => {
        const on = it.name === active;
        return (
          <div key={it.name} style={{
            flex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 4,
            color: on ? 'var(--accent)' : 'var(--text2)',
            cursor: 'pointer',
          }}>
            <div style={{ position: 'relative' }}>
              {it.icon}
              {it.name === 'Alerts' && <span style={{
                position: 'absolute', top: -2, right: -4,
                minWidth: 14, height: 14, padding: '0 3px',
                borderRadius: 999,
                background: 'var(--live)',
                color: 'var(--bg)',
                fontSize: 9, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--surf)',
              }}>3</span>}
            </div>
            <span style={{
              fontSize: 10, fontWeight: on ? 600 : 500, letterSpacing: '0.02em',
            }}>{it.name}</span>
          </div>
        );
      })}
    </div>
  );
}

function DateScrubber({ activeIdx = 2 }) {
  const days = [
    { label: 'Wed', date: '19', dLabel: '19 Feb' },
    { label: 'Thu', date: '20', dLabel: '20 Feb' },
    { label: 'Today', date: '21', dLabel: '21 Feb' },
    { label: 'Sat', date: '22', dLabel: '22 Feb' },
    { label: 'Sun', date: '23', dLabel: '23 Feb' },
    { label: 'Mon', date: '24', dLabel: '24 Feb' },
    { label: 'Tue', date: '25', dLabel: '25 Feb' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button style={scrubArrow}>{I.chevL}</button>
      <div style={{ display: 'flex', gap: 6, flex: 1, overflowX: 'auto' }}>
        {days.map((d, i) => {
          const on = i === activeIdx;
          const today = d.label === 'Today';
          return (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minWidth: 54, height: 56, padding: '0 10px',
              borderRadius: 8,
              background: on ? 'var(--accent)' : 'var(--surf)',
              border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
              color: on ? 'var(--bg)' : 'var(--text)',
              cursor: 'pointer',
              flex: '0 0 auto',
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
                color: on ? 'var(--bg)' : today ? 'var(--accent)' : 'var(--text3)' }}>
                {d.label}
              </span>
              <span className="rl-mono" style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{d.date}</span>
            </div>
          );
        })}
      </div>
      <button style={scrubArrow}>{I.chevR}</button>
    </div>
  );
}
const scrubArrow = {
  width: 36, height: 36, borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--surf)',
  color: 'var(--text2)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  flex: '0 0 auto',
};

function FilterPills({ active = 'All' }) {
  const pills = [
    { label: 'All',       count: 14 },
    { label: 'Live Now',  count: 2, live: true },
    { label: 'Finished',  count: 5 },
    { label: 'Upcoming',  count: 7 },
  ];
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {pills.map(p => {
        const on = p.label === active;
        return (
          <div key={p.label} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 12px',
            borderRadius: 999,
            border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
            background: on ? 'var(--accent2)' : 'var(--surf)',
            color: on ? 'var(--accent)' : 'var(--text2)',
            fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
          }}>
            {p.live && <span className="rl-live-dot" />}
            <span>{p.label}</span>
            <span className="rl-mono" style={{
              fontSize: 11, color: on ? 'var(--accent)' : 'var(--text3)',
              opacity: 0.9,
            }}>{p.count}</span>
          </div>
        );
      })}
    </div>
  );
}

function CompGroupHeader({ competition, round, liveCount = 0, following = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 4px',
      borderBottom: '1px solid var(--border)',
      marginBottom: 14,
    }}>
      <CompLogo comp={competition} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{competition.name}</div>
        {round && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{round}</div>}
      </div>
      {liveCount > 0 && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 8px', borderRadius: 999,
          background: 'var(--live2)', color: 'var(--live)',
          fontSize: 11, fontWeight: 600,
        }}>
          <span className="rl-live-dot" />
          {liveCount} Live
        </span>
      )}
      <FollowButton following={following} />
    </div>
  );
}

function MatchCard({ match, compact = false }) {
  const { homeTeam, awayTeam, homeScore, awayScore, status, clock, kickoff, venue, scorers } = match;
  const isScheduled = status === 'scheduled';
  const homeWon = homeScore != null && awayScore != null && homeScore > awayScore;
  const awayWon = homeScore != null && awayScore != null && awayScore > homeScore;
  const scoreColor = (won) => status === 'finished'
    ? (won ? 'var(--text)' : 'var(--text2)')
    : 'var(--text)';
  const scoreWeight = (won) => status === 'finished' && won ? 700 : 500;

  return (
    <div className="rl-card" style={{ padding: compact ? 12 : 14 }}>
      <TeamRow team={homeTeam} score={homeScore} won={homeWon} scoreColor={scoreColor(homeWon)} scoreWeight={scoreWeight(homeWon)} />
      <div style={{ height: 8 }} />
      <TeamRow team={awayTeam} score={awayScore} won={awayWon} scoreColor={scoreColor(awayWon)} scoreWeight={scoreWeight(awayWon)} />

      <div style={{
        marginTop: 12, paddingTop: 10,
        borderTop: '1px solid var(--border2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <StatusBadge status={status} clock={clock} kickoff={isScheduled ? kickoff : kickoff} />
        {venue && <span style={{
          fontSize: 11, color: 'var(--text3)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '65%',
          textAlign: 'right',
        }}>{venue}</span>}
      </div>

      {scorers && scorers.length > 0 && status !== 'finished' && <ScorerPills scorers={scorers} />}
    </div>
  );
}
function TeamRow({ team, score, won, scoreColor, scoreWeight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <TeamCrest team={team} size={22} />
      <span style={{
        flex: 1,
        fontSize: 14, fontWeight: won ? 600 : 500,
        color: won ? 'var(--text)' : 'var(--text)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{team.name}</span>
      <span className="rl-mono" style={{
        fontSize: 14, fontWeight: scoreWeight, color: scoreColor,
        minWidth: 24, textAlign: 'right',
      }}>{score == null ? '–' : score}</span>
    </div>
  );
}

Object.assign(window, {
  Navbar, Sidebar, MobileNav, DateScrubber, FilterPills, CompGroupHeader, MatchCard,
});
