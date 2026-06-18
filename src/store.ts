import { create } from 'zustand'
import { Subject } from './types'
import { db } from './db'

interface AppState {
  subjects: Subject[]
  loading: boolean
  authenticated: boolean
  darkMode: boolean

  loadSubjects: () => Promise<void>
  setAuthenticated: (v: boolean) => void
  toggleDarkMode: () => void
  initTheme: () => void
}

export const useStore = create<AppState>((set, get) => ({
  subjects: [],
  loading: false,
  authenticated: false,
  darkMode: false,

  loadSubjects: async () => {
    set({ loading: true })
    await db.init()
    const subjects = await db.getSubjects()
    set({ subjects, loading: false })
  },

  setAuthenticated: (v) => set({ authenticated: v }),

  toggleDarkMode: () => {
    const next = !get().darkMode
    set({ darkMode: next })
    document.documentElement.classList.toggle('dark', next)
    db.setSetting('darkMode', next)
  },

  initTheme: async () => {
    const saved = await db.getSetting('darkMode')
    if (saved) {
      set({ darkMode: true })
      document.documentElement.classList.add('dark')
    }
  }
}))
