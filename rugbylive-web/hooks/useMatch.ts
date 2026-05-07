'use client'
import { useQuery } from '@tanstack/react-query'
import { fetchMatch, fetchMatchDetail } from '@/lib/api'
import { isLive } from '@/lib/utils'
import type { MatchDetail } from '@/types'

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

export function useMatchDetail(id: string) {
  return useQuery<MatchDetail>({
    queryKey: ['matchDetail', id],
    queryFn: () => fetchMatchDetail(id),
    staleTime: 10_000,
    refetchInterval: (query) => {
      const match = query.state.data?.match
      if (!match) return false
      return isLive(match.status) ? 15_000 : false
    },
    refetchIntervalInBackground: false,
  })
}
