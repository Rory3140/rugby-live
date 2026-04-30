import { useQuery } from '@tanstack/react-query'
import { fetchMatch, fetchH2H } from '@/lib/api'
import { isLive } from '@/lib/utils'

export function useMatch(id: string) {
  return useQuery({
    queryKey: ['match', id],
    queryFn: () => fetchMatch(id),
    staleTime: 10_000,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return false
      return isLive(data.status) ? 15_000 : false
    },
    refetchIntervalInBackground: false,
  })
}

export function useH2H(id: string) {
  return useQuery({
    queryKey: ['h2h', id],
    queryFn: () => fetchH2H(id),
    staleTime: 300_000,
  })
}
