'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FollowStore {
  followedLeagues: string[]
  followedTeams: string[]
  followLeague: (id: string) => void
  unfollowLeague: (id: string) => void
  followTeam: (id: string) => void
  unfollowTeam: (id: string) => void
  isFollowingLeague: (id: string) => boolean
  isFollowingTeam: (id: string) => boolean
}

export const useFollowStore = create<FollowStore>()(
  persist(
    (set, get) => ({
      followedLeagues: [],
      followedTeams: [],
      followLeague: (id) => set(s => ({ followedLeagues: [...s.followedLeagues, id] })),
      unfollowLeague: (id) => set(s => ({ followedLeagues: s.followedLeagues.filter(l => l !== id) })),
      followTeam: (id) => set(s => ({ followedTeams: [...s.followedTeams, id] })),
      unfollowTeam: (id) => set(s => ({ followedTeams: s.followedTeams.filter(t => t !== id) })),
      isFollowingLeague: (id) => get().followedLeagues.includes(id),
      isFollowingTeam: (id) => get().followedTeams.includes(id),
    }),
    { name: 'rugbylive-follows' }
  )
)
