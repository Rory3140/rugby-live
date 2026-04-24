import { useQuery } from '@tanstack/react-query'
import { fetchMatches } from '@/lib/api'
import { isLive } from '@/lib/utils'

export function useLiveScores(date: string) {
  return useQuery({
    queryKey: ['matches', date],
    queryFn: () => fetchMatches(date),
    staleTime: 10_000,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data?.length) return 300_000
      return data.some(m => isLive(m.status)) ? 15_000 : 300_000
    },
    refetchIntervalInBackground: false,
  })
}
