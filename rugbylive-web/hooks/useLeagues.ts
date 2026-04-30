import { useQuery } from '@tanstack/react-query'
import { fetchLeagues, fetchLeagueSeasons } from '@/lib/api'
import type { Season } from '@/types'

export function useLeagues() {
  return useQuery({
    queryKey: ['leagues'],
    queryFn: fetchLeagues,
    staleTime: 3_600_000,
  })
}

export function useLeague(id: string) {
  return useQuery({
    queryKey: ['leagues'],
    queryFn: fetchLeagues,
    staleTime: 3_600_000,
    select: (leagues) => leagues.find(l => l.id === id) ?? null,
  })
}

export function useLeagueSeasons(leagueId: string) {
  return useQuery<Season[]>({
    queryKey: ['leagueSeasons', leagueId],
    queryFn: () => fetchLeagueSeasons(leagueId),
    staleTime: 3_600_000,
  })
}
