import { create } from 'zustand'
import { Page } from '../types'

interface PageStore {
  pages: Page[]
  selectedPageId: number | null
  selectedPageType: string | null
  sidebarWidth: number
  loadPages: () => Promise<void>
  selectPage: (id: number, type: string) => void
  selectGlobalCalendar: () => void
  setSidebarWidth: (w: number) => void
}

export const usePageStore = create<PageStore>((set) => ({
  pages: [],
  selectedPageId: null,
  selectedPageType: null,
  sidebarWidth: 240,

  loadPages: async () => {
    const pages = await window.api.getAllPages()
    set({ pages })
  },

  selectPage: (id, type) => set({ selectedPageId: id, selectedPageType: type }),
  selectGlobalCalendar: () => set({ selectedPageId: null, selectedPageType: 'calendar' }),
  setSidebarWidth: (w) => set({ sidebarWidth: w }),
}))
