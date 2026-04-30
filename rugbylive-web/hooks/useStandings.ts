import { useQuery } from '@tanstack/react-query'
import { fetchStandings, fetchLeagueMatches } from '@/lib/api'

// seasonId is now a SAP season ID string (e.g. "82834"), not a year number.
export function useStandings(leagueId: string, seasonId?: string) {
  return useQuery({
    queryKey: ['standings', leagueId, seasonId],
    queryFn: () => fetchStandings(leagueId, seasonId),
    staleTime: 300_000,
    enabled: !!seasonId,
  })
}

export function useLeagueMatches(leagueId: string, seasonId?: string) {
  return useQuery({
    queryKey: ['leagueMatches', leagueId, seasonId],
    queryFn: () => fetchLeagueMatches(leagueId, seasonId),
    staleTime: 300_000,
    enabled: !!seasonId,
  })
}
