'use client'
import { useQuery } from '@tanstack/react-query'
import { fetchMatch, fetchH2HSummary } from '@/lib/api'
import { isLive } from '@/lib/utils'
import type { H2HSummary } from '@/types'

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
  return useQuery<H2HSummary>({
    queryKey: ['h2h', id],
    queryFn: () => fetchH2HSummary(id),
    staleTime: 300_000,
  })
}
