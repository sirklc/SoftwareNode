import { create } from 'zustand'
import { Page } from '../types'

interface PageStore {
  pages: Page[]
  selectedPageId: number | null
  selectedPageType: string | null
  sidebarWidth: number
  recentPageIds: number[]
  loadPages: () => Promise<void>
  selectPage: (id: number, type: string) => void
  selectGlobalCalendar: () => void
  selectHome: () => void
  selectLibrary: () => void
  selectTasks: () => void
  setSidebarWidth: (w: number) => void
}

export const usePageStore = create<PageStore>((set) => ({
  pages: [],
  selectedPageId: null,
  selectedPageType: 'home',
  sidebarWidth: 240,
  recentPageIds: [],

  loadPages: async () => {
    const pages = await window.api.getAllPages()
    set({ pages })
  },

  selectPage: (id, type) => set(s => ({
    selectedPageId: id,
    selectedPageType: type,
    recentPageIds: [id, ...s.recentPageIds.filter(x => x !== id)].slice(0, 8),
  })),

  selectGlobalCalendar: () => set({ selectedPageId: null, selectedPageType: 'calendar' }),
  selectHome: () => set({ selectedPageId: null, selectedPageType: 'home' }),
  selectLibrary: () => set({ selectedPageId: null, selectedPageType: 'library' }),
  selectTasks: () => set({ selectedPageId: null, selectedPageType: 'tasks' }),
  setSidebarWidth: (w) => set({ sidebarWidth: w }),
}))
