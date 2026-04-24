// RugbyLive fixtures — fictional but faithful. Real competitions (facts, not copyrighted),
// fictional team names to avoid trading on specific clubs' IP beyond use as descriptive facts.
// Schema matches /types/index.ts from the brief.

const TEAMS = {
  IRE: { id: 'ire', name: 'Ireland',    shortName: 'IRE', country: 'Ireland' },
  FRA: { id: 'fra', name: 'France',     shortName: 'FRA', country: 'France' },
  ENG: { id: 'eng', name: 'England',    shortName: 'ENG', country: 'England' },
  SCO: { id: 'sco', name: 'Scotland',   shortName: 'SCO', country: 'Scotland' },
  WAL: { id: 'wal', name: 'Wales',      shortName: 'WAL', country: 'Wales' },
  ITA: { id: 'ita', name: 'Italy',      shortName: 'ITA', country: 'Italy' },
  NZL: { id: 'nzl', name: 'New Zealand',shortName: 'NZL', country: 'New Zealand' },
  RSA: { id: 'rsa', name: 'South Africa', shortName: 'RSA', country: 'South Africa' },
  AUS: { id: 'aus', name: 'Australia',  shortName: 'AUS', country: 'Australia' },
  ARG: { id: 'arg', name: 'Argentina',  shortName: 'ARG', country: 'Argentina' },

  // URC fictional clubs (avoiding any specific branded clubs)
  LEI: { id: 'lei', name: 'Leinster',   shortName: 'LEI', country: 'Ireland' },
  MUN: { id: 'mun', name: 'Munster',    shortName: 'MUN', country: 'Ireland' },
  GLA: { id: 'gla', name: 'Glasgow',    shortName: 'GLA', country: 'Scotland' },
  EDI: { id: 'edi', name: 'Edinburgh',  shortName: 'EDI', country: 'Scotland' },
  ULS: { id: 'uls', name: 'Ulster',     shortName: 'ULS', country: 'Ireland' },
  CAR: { id: 'car', name: 'Cardiff',    shortName: 'CAR', country: 'Wales' },
  BUL: { id: 'bul', name: 'Bulls',      shortName: 'BUL', country: 'South Africa' },
  STO: { id: 'sto', name: 'Stormers',   shortName: 'STO', country: 'South Africa' },

  // Premiership fictional
  BAT: { id: 'bat', name: 'Bath',       shortName: 'BAT', country: 'England' },
  SAR: { id: 'sar', name: 'Sarries',    shortName: 'SAR', country: 'England' },
  NOR: { id: 'nor', name: 'Northampton',shortName: 'NOR', country: 'England' },
  EXE: { id: 'exe', name: 'Exeter',     shortName: 'EXE', country: 'England' },
};

const COMPS = {
  SIX:   { id: 'sixn', name: 'Six Nations',              shortName: '6N',  type: 'international', hemisphere: 'north' },
  URC:   { id: 'urc',  name: 'United Rugby Championship',shortName: 'URC', type: 'club',          hemisphere: 'global' },
  PREM:  { id: 'prem', name: 'Gallagher Premiership',    shortName: 'PR',  type: 'club',          hemisphere: 'north' },
  TOP14: { id: 't14',  name: 'Top 14',                   shortName: 'T14', type: 'club',          hemisphere: 'north' },
  SRP:   { id: 'srp',  name: 'Super Rugby Pacific',      shortName: 'SR',  type: 'club',          hemisphere: 'south' },
  CHAMP: { id: 'cc',   name: 'Champions Cup',            shortName: 'CC',  type: 'club',          hemisphere: 'north' },
};

// Grouped fixtures for the home page
const MATCH_GROUPS = [
  {
    competition: COMPS.SIX,
    round: 'Round 4',
    liveCount: 1,
    following: true,
    matches: [
      {
        id: 'm1', competition: COMPS.SIX, round: 'Round 4',
        homeTeam: TEAMS.IRE, awayTeam: TEAMS.FRA,
        homeScore: 22, awayScore: 17,
        status: 'live', clock: "58'", kickoff: '14:15',
        venue: 'Aviva Stadium, Dublin',
        scorers: [
          { player: 'Lowe', minute: 12, team: 'home' },
          { player: 'Ringrose', minute: 34, team: 'home' },
          { player: 'Dupont', minute: 41, team: 'away', card: null },
          { player: 'Penaud', minute: 52, team: 'away' },
        ],
      },
      {
        id: 'm2', competition: COMPS.SIX, round: 'Round 4',
        homeTeam: TEAMS.ENG, awayTeam: TEAMS.SCO,
        homeScore: null, awayScore: null,
        status: 'scheduled', clock: null, kickoff: '16:45',
        venue: 'Twickenham',
      },
      {
        id: 'm3', competition: COMPS.SIX, round: 'Round 4',
        homeTeam: TEAMS.WAL, awayTeam: TEAMS.ITA,
        homeScore: null, awayScore: null,
        status: 'scheduled', clock: null, kickoff: '19:30',
        venue: 'Principality Stadium',
      },
    ],
  },
  {
    competition: COMPS.URC,
    round: 'Round 14',
    liveCount: 1,
    following: false,
    matches: [
      {
        id: 'm4', competition: COMPS.URC,
        homeTeam: TEAMS.LEI, awayTeam: TEAMS.BUL,
        homeScore: 31, awayScore: 24,
        status: 'finished', clock: null, kickoff: '15:00',
        venue: 'RDS Arena',
      },
      {
        id: 'm5', competition: COMPS.URC,
        homeTeam: TEAMS.GLA, awayTeam: TEAMS.MUN,
        homeScore: 14, awayScore: 14,
        status: 'halftime', clock: 'HT', kickoff: '17:15',
        venue: 'Scotstoun',
        scorers: [
          { player: 'McDowall', minute: 8, team: 'home' },
          { player: 'Hansen', minute: 28, team: 'away' },
        ],
      },
      {
        id: 'm6', competition: COMPS.URC,
        homeTeam: TEAMS.EDI, awayTeam: TEAMS.STO,
        homeScore: null, awayScore: null,
        status: 'scheduled', clock: null, kickoff: '19:35',
        venue: 'Hive Stadium',
      },
    ],
  },
  {
    competition: COMPS.PREM,
    round: 'Round 17',
    liveCount: 0,
    following: true,
    matches: [
      {
        id: 'm7', competition: COMPS.PREM,
        homeTeam: TEAMS.BAT, awayTeam: TEAMS.SAR,
        homeScore: 27, awayScore: 19,
        status: 'finished', clock: null, kickoff: '14:00',
        venue: 'The Rec',
      },
      {
        id: 'm8', competition: COMPS.PREM,
        homeTeam: TEAMS.NOR, awayTeam: TEAMS.EXE,
        homeScore: null, awayScore: null,
        status: 'scheduled', clock: null, kickoff: 'Sun 14:00',
        venue: 'Franklin’s Gardens',
      },
    ],
  },
];

// League table (Six Nations)
const STANDINGS = [
  { position: 1, team: TEAMS.IRE, played: 3, won: 3, drawn: 0, lost: 0, pointsFor: 98,  pointsAgainst: 48, pointsDiff: +50, points: 14 },
  { position: 2, team: TEAMS.FRA, played: 3, won: 2, drawn: 0, lost: 1, pointsFor: 81,  pointsAgainst: 62, pointsDiff: +19, points: 11 },
  { position: 3, team: TEAMS.ENG, played: 3, won: 2, drawn: 0, lost: 1, pointsFor: 74,  pointsAgainst: 59, pointsDiff: +15, points: 10 },
  { position: 4, team: TEAMS.SCO, played: 3, won: 1, drawn: 0, lost: 2, pointsFor: 60,  pointsAgainst: 68, pointsDiff:  -8, points:  6 },
  { position: 5, team: TEAMS.WAL, played: 3, won: 0, drawn: 1, lost: 2, pointsFor: 51,  pointsAgainst: 73, pointsDiff: -22, points:  3 },
  { position: 6, team: TEAMS.ITA, played: 3, won: 0, drawn: 1, lost: 2, pointsFor: 44,  pointsAgainst: 98, pointsDiff: -54, points:  3 },
];

// Match detail — stats
const DETAIL = {
  match: MATCH_GROUPS[0].matches[0], // IRE v FRA live
  stats: [
    { label: 'Possession',     home: 58,  away: 42,  unit: '%' },
    { label: 'Territory',      home: 63,  away: 37,  unit: '%' },
    { label: 'Tries',          home: 3,   away: 2,   unit: '' },
    { label: 'Metres carried', home: 412, away: 298, unit: '' },
    { label: 'Scrums won',     home: 6,   away: 4,   unit: '' },
    { label: 'Lineouts won',   home: 11,  away: 8,   unit: '' },
    { label: 'Tackle success', home: 88,  away: 82,  unit: '%' },
  ],
  timeline: [
    { minute: 4,  team: 'home', type: 'penalty',    player: 'Crowley',    homeScore: 3,  awayScore: 0 },
    { minute: 12, team: 'home', type: 'try',        player: 'Lowe',       homeScore: 8,  awayScore: 0 },
    { minute: 13, team: 'home', type: 'conversion', player: 'Crowley',    homeScore: 10, awayScore: 0 },
    { minute: 24, team: 'away', type: 'penalty',    player: 'Ramos',      homeScore: 10, awayScore: 3 },
    { minute: 34, team: 'home', type: 'try',        player: 'Ringrose',   homeScore: 15, awayScore: 3 },
    { minute: 35, team: 'home', type: 'conversion', player: 'Crowley',    homeScore: 17, awayScore: 3 },
    { minute: 40, team: 'home', type: 'half_time',  player: null,         homeScore: 17, awayScore: 3 },
    { minute: 41, team: 'away', type: 'try',        player: 'Dupont',     homeScore: 17, awayScore: 8 },
    { minute: 43, team: 'away', type: 'conversion', player: 'Ramos',      homeScore: 17, awayScore: 10 },
    { minute: 49, team: 'away', type: 'yellow_card',player: 'Alldritt',   homeScore: 17, awayScore: 10 },
    { minute: 52, team: 'away', type: 'try',        player: 'Penaud',     homeScore: 17, awayScore: 15 },
    { minute: 53, team: 'away', type: 'conversion', player: 'Ramos',      homeScore: 17, awayScore: 17 },
    { minute: 57, team: 'home', type: 'penalty',    player: 'Crowley',    homeScore: 20, awayScore: 17 },
  ],
};

Object.assign(window, { TEAMS, COMPS, MATCH_GROUPS, STANDINGS, DETAIL });
