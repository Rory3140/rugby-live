// LeagueTable, MatchHero, StatBars, MatchTimeline

function LeagueTable({ standings, title = 'Six Nations', round = 'Standings · Round 3' }) {
  return (
    <div style={{ background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <CompLogo comp={{ name: title, shortName: '6N' }} size={30} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{round}</div>
        </div>
        <FollowButton following={true} />
      </div>

      {/* Header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr repeat(7, 36px) 46px',
        alignItems: 'center', gap: 4,
        padding: '10px 16px',
        borderBottom: '1px solid var(--border2)',
      }}>
        <div />
        <div className="rl-label">Team</div>
        {['P','W','D','L','PF','PA','PD'].map(k => (
          <div key={k} className="rl-label" style={{ textAlign: 'center' }}>{k}</div>
        ))}
        <div className="rl-label" style={{ textAlign: 'right', color: 'var(--accent)' }}>PTS</div>
      </div>

      {/* Rows */}
      {standings.map((s, i) => {
        const promoted = i < 1; // visual cue for top spot
        return (
          <div key={s.team.id} style={{
            display: 'grid',
            gridTemplateColumns: '32px 1fr repeat(7, 36px) 46px',
            alignItems: 'center', gap: 4,
            padding: '12px 16px',
            borderBottom: i < standings.length - 1 ? '1px solid var(--border2)' : 'none',
            position: 'relative',
          }}>
            {/* Position accent rail for leader */}
            {promoted && <div style={{
              position: 'absolute', left: 0, top: 8, bottom: 8, width: 2,
              background: 'var(--accent)', borderRadius: 2,
            }} />}
            <div className="rl-mono" style={{
              fontSize: 12, color: promoted ? 'var(--accent)' : 'var(--text3)', fontWeight: 600,
            }}>{s.position}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <TeamCrest team={s.team} size={20} />
              <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.team.name}
              </span>
            </div>
            {[s.played, s.won, s.drawn, s.lost, s.pointsFor, s.pointsAgainst].map((v, j) => (
              <div key={j} className="rl-mono" style={{ fontSize: 12, textAlign: 'center', color: 'var(--text2)' }}>{v}</div>
            ))}
            <div className="rl-mono" style={{
              fontSize: 12, textAlign: 'center',
              color: s.pointsDiff > 0 ? 'var(--green)' : s.pointsDiff < 0 ? 'var(--text3)' : 'var(--text2)',
              fontWeight: 600,
            }}>{s.pointsDiff > 0 ? `+${s.pointsDiff}` : s.pointsDiff}</div>
            <div className="rl-mono" style={{
              fontSize: 14, textAlign: 'right',
              color: 'var(--accent)', fontWeight: 700,
            }}>{s.points}</div>
          </div>
        );
      })}
    </div>
  );
}

function MatchHero({ match }) {
  const { homeTeam, awayTeam, homeScore, awayScore, clock, venue, competition, round } = match;
  return (
    <div style={{
      background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 12,
      padding: '20px 24px',
    }}>
      {/* Comp strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <CompLogo comp={competition} size={22} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{competition.name}</span>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>· {round || 'Round 4'}</span>
        <div style={{ flex: 1 }} />
        <LiveBadge clock={clock || "58'"} />
      </div>

      {/* Score row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <TeamCrest team={homeTeam} size={54} />
          <div style={{ fontSize: 14, fontWeight: 700 }}>{homeTeam.name}</div>
          <div className="rl-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.12em' }}>HOME</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span className="rl-display" style={{
            fontSize: 56, lineHeight: 1, letterSpacing: '0.08em', color: 'var(--live)',
            fontVariantNumeric: 'tabular-nums',
          }}>{homeScore}</span>
          <span className="rl-display" style={{ fontSize: 32, color: 'var(--text3)', lineHeight: 1 }}>–</span>
          <span className="rl-display" style={{
            fontSize: 56, lineHeight: 1, letterSpacing: '0.08em', color: 'var(--live)',
            fontVariantNumeric: 'tabular-nums',
          }}>{awayScore}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <TeamCrest team={awayTeam} size={54} />
          <div style={{ fontSize: 14, fontWeight: 700 }}>{awayTeam.name}</div>
          <div className="rl-mono" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.12em' }}>AWAY</div>
        </div>
      </div>

      {/* Venue strip */}
      <div style={{
        marginTop: 18, paddingTop: 14,
        borderTop: '1px solid var(--border2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 11, color: 'var(--text3)',
      }}>
        <span>{venue || '—'}</span>
        <span className="rl-mono">SAT 21 FEB · KO 14:15</span>
      </div>

      {/* Tab bar */}
      <div style={{ marginTop: 18, display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginLeft: -24, marginRight: -24, marginBottom: -20, padding: '0 24px' }}>
        {['Summary', 'Stats', 'Lineups', 'H2H'].map((t, i) => {
          const on = i === 1;
          return (
            <div key={t} style={{
              padding: '12px 14px',
              fontSize: 12, fontWeight: on ? 600 : 500,
              color: on ? 'var(--text)' : 'var(--text2)',
              borderBottom: `2px solid ${on ? 'var(--accent)' : 'transparent'}`,
              marginBottom: -1,
              cursor: 'pointer',
            }}>{t}</div>
          );
        })}
      </div>
    </div>
  );
}

function StatBars({ stats, match }) {
  return (
    <div style={{ background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 10, padding: 18 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <div className="rl-label">Match Stats</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 11, color: 'var(--text2)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent)' }} />
            {match.homeTeam.shortName}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--surf4)' }} />
            {match.awayTeam.shortName}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {stats.map(s => {
          const total = s.home + s.away;
          const homePct = Math.max(4, Math.round((s.home / total) * 100));
          const awayPct = 100 - homePct;
          return (
            <div key={s.label}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 6,
              }}>
                <span className="rl-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                  {s.home}{s.unit}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em',
                  color: 'var(--text3)',
                }}>{s.label}</span>
                <span className="rl-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
                  {s.away}{s.unit}
                </span>
              </div>
              <div style={{
                display: 'flex', height: 6, borderRadius: 999, overflow: 'hidden',
                background: 'var(--surf3)',
              }}>
                <div style={{ width: `${homePct}%`, background: 'var(--accent)' }} />
                <div style={{ width: 2 }} />
                <div style={{ width: `${awayPct}%`, background: 'var(--surf4)' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatchTimeline({ events, match }) {
  const iconFor = (type) => {
    if (type === 'try') return <RugbyBall size={10} color="var(--accent)" />;
    if (type === 'conversion') return <span className="rl-mono" style={{ fontSize: 10, color: 'var(--text2)' }}>CON</span>;
    if (type === 'penalty') return <span className="rl-mono" style={{ fontSize: 10, color: 'var(--text2)' }}>PEN</span>;
    if (type === 'yellow_card') return <span style={{ width: 8, height: 11, background: '#facc15', borderRadius: 1 }} />;
    if (type === 'red_card') return <span style={{ width: 8, height: 11, background: 'var(--live)', borderRadius: 1 }} />;
    if (type === 'half_time') return <span className="rl-mono" style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.12em' }}>HT</span>;
    return null;
  };
  const labelFor = (type) => ({
    try: 'Try', conversion: 'Conversion', penalty: 'Penalty kick',
    yellow_card: 'Yellow card', red_card: 'Red card',
    half_time: 'Half time', full_time: 'Full time',
  }[type] || type);

  return (
    <div style={{ background: 'var(--surf)', border: '1px solid var(--border)', borderRadius: 10, padding: 18 }}>
      <div className="rl-label" style={{ marginBottom: 14 }}>Summary</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {events.map((ev, i) => {
          const isHT = ev.type === 'half_time';
          if (isHT) {
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 0',
              }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span className="rl-mono" style={{
                  fontSize: 10, color: 'var(--text3)', fontWeight: 700,
                  letterSpacing: '0.16em',
                }}>HALF TIME · {ev.homeScore}–{ev.awayScore}</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
            );
          }
          const isHome = ev.team === 'home';
          return (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 46px 1fr',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: i < events.length - 1 ? '1px solid var(--border2)' : 'none',
            }}>
              {/* Home side */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                justifyContent: 'flex-end',
                opacity: isHome ? 1 : 0.28,
              }}>
                {isHome && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{ev.player}</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{labelFor(ev.type)}</span>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22 }}>
                      {iconFor(ev.type)}
                    </span>
                  </>
                )}
              </div>

              {/* Minute spine */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="rl-mono" style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--text2)',
                  padding: '3px 7px', borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: 'var(--surf2)',
                }}>{ev.minute}'</span>
              </div>

              {/* Away side */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: isHome ? 0.28 : 1,
              }}>
                {!isHome && (
                  <>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22 }}>
                      {iconFor(ev.type)}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{ev.player}</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{labelFor(ev.type)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { LeagueTable, MatchHero, StatBars, MatchTimeline });
