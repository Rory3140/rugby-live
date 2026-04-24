import { useQuery } from '@tanstack/react-query'
import { fetchStandings, fetchLeagueMatches } from '@/lib/api'

export function useStandings(leagueId: string, season?: number) {
  return useQuery({
    queryKey: ['standings', leagueId, season],
    queryFn: () => fetchStandings(leagueId, season),
    staleTime: 300_000,
  })
}

export function useLeagueMatches(leagueId: string, season?: number) {
  return useQuery({
    queryKey: ['leagueMatches', leagueId, season],
    queryFn: () => fetchLeagueMatches(leagueId, season),
    staleTime: 300_000,
  })
}
