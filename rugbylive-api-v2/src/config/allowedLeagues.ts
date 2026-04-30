// Curated list of competitions to show in RugbyLive.
// IDs are SportsAPI Pro uniqueTournament IDs confirmed from live schedule data.
// This is the source of truth for what appears in the leagues browser + match feed filter.
// In-memory active/category overrides are applied on top at runtime (see leagueStore.ts).

export interface LeagueConfig {
  id: string
  name: string
  country: string | null
  category: 'International' | 'Club' | 'Sevens'
}

export const ALLOWED_LEAGUES: LeagueConfig[] = [
  // ─── International ────────────────────────────────────────────────────────────
  { id: '423',   name: 'Six Nations',                  country: null,         category: 'International' },
  { id: '2055',  name: 'Six Nations, Women',           country: null,         category: 'International' },
  { id: '789',   name: 'The Rugby Championship',       country: null,         category: 'International' },
  { id: '876',   name: 'International Friendly Games', country: null,         category: 'International' },
  { id: '13667', name: 'Pacific Championship',         country: null,         category: 'International' },
  { id: '2321',  name: 'European Nations Cup',         country: null,         category: 'International' },

  // ─── Club — Northern Hemisphere ──────────────────────────────────────────────
  { id: '419',   name: 'United Rugby Championship',    country: null,         category: 'Club' },
  { id: '424',   name: 'English Premiership',          country: 'England',    category: 'Club' },
  { id: '420',   name: 'France - Top 14',              country: 'France',     category: 'Club' },
  { id: '1147',  name: 'France - Pro D2',              country: 'France',     category: 'Club' },
  { id: '401',   name: 'European Rugby Champions Cup', country: null,         category: 'Club' },
  { id: '752',   name: 'European Rugby Challenge Cup', country: null,         category: 'Club' },
  { id: '1323',  name: 'RFU Championship',             country: 'England',    category: 'Club' },
  { id: '566',   name: 'Serie A Elite',                country: 'Italy',      category: 'Club' },

  // ─── Club — Southern Hemisphere ──────────────────────────────────────────────
  { id: '422',   name: 'Super Rugby',                  country: null,         category: 'Club' },
  { id: '20366', name: 'Super Rugby Americas',         country: null,         category: 'Club' },
  { id: '796',   name: 'Currie Cup',                   country: 'South Africa', category: 'Club' },
  { id: '797',   name: 'National Provincial Championship', country: 'New Zealand', category: 'Club' },
  { id: '14662', name: 'Major League Rugby',           country: 'USA',        category: 'Club' },
  { id: '2309',  name: 'URBA Top 12',                  country: 'Argentina',  category: 'Club' },
  { id: '19525', name: 'Division de Honor',            country: 'Spain',      category: 'Club' },
  { id: '34265', name: 'División de Honor Élite',      country: 'Spain',      category: 'Club' },

  // ─── Rugby League ─────────────────────────────────────────────────────────────
  { id: '294',   name: 'NRL',                          country: 'Australia',  category: 'Club' },
  { id: '302',   name: 'Super League',                 country: 'England',    category: 'Club' },
  { id: '1582',  name: 'RFL Championship',             country: 'England',    category: 'Club' },
  { id: '2134',  name: 'New South Wales Cup',          country: 'Australia',  category: 'Club' },
  { id: '2135',  name: 'Queensland Cup',               country: 'Australia',  category: 'Club' },

  // ─── Sevens ───────────────────────────────────────────────────────────────────
  { id: '10055', name: 'World Rugby Sevens Series',          country: null, category: 'Sevens' },
  { id: '11623', name: 'World Rugby Sevens Series, Women',   country: null, category: 'Sevens' },
]

export const ALLOWED_IDS = new Set(ALLOWED_LEAGUES.map(l => l.id))
