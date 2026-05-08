/**
 * Cross-provider match resolution.
 *
 * When a client requests a match by ID (e.g. "as_12345"), we know the provider
 * and internal game ID. For H2H and highlights we need to resolve across
 * providers. We do this by normalising team names to a canonical key and
 * building a per-date index.
 *
 * The cache is intentionally lightweight — keyed by date string, evicted after 1h.
 */

// Strip common suffixes/words that differ between providers, then collapse to alphanum
const STRIP = /\b(rugby|rfc|fc|club|sport|sports|union)\b/gi

export function normaliseTeamName(name: string): string {
  return name.toLowerCase().replace(STRIP, '').replace(/[^a-z0-9]/g, '').trim()
}

// Fuzzy match: exact after normalise, OR one normalised name is a substring of the other
export function teamNamesMatch(a: string, b: string): boolean {
  const na = normaliseTeamName(a)
  const nb = normaliseTeamName(b)
  return na === nb || na.includes(nb) || nb.includes(na)
}

export function matchKey(home: string, away: string): string {
  return `${normaliseTeamName(home)}__${normaliseTeamName(away)}`
}

export function providerFromId(id: string): 'as' | 'hl' | 'sap' | null {
  if (id.startsWith('as_')) return 'as'
  if (id.startsWith('hl_')) return 'hl'
  if (id.startsWith('sap_')) return 'sap'
  return null
}

export function rawId(id: string): string {
  return id.replace(/^(as_|hl_|sap_)/, '')
}
