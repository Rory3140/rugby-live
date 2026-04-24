import { useQuery } from '@tanstack/react-query'
import { fetchLeagues } from '@/lib/api'

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
