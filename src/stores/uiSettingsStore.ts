import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UISettings, DEFAULT_UI_SETTINGS, EntityType, Operation, ContainerType, DrawerPosition } from '../types/uiSettings'

interface UISettingsStore extends UISettings {
  // Actions
  setContainerPreference: (entity: EntityType, operation: Operation, type: ContainerType) => void
  setDrawerPosition: (position: DrawerPosition) => void
  setDrawerWidth: (width: number) => void
  resetToDefaults: () => void
  getContainerType: (entity: EntityType, operation: Operation) => ContainerType
}

export const useUISettingsStore = create<UISettingsStore>()(
  persist(
    (set, get) => ({
      // Default state
      ...DEFAULT_UI_SETTINGS,

      // Actions
      setContainerPreference: (entity, operation, type) => {
        set(state => {
          const newState = {
            containerPreferences: {
              ...state.containerPreferences,
              [entity]: {
                ...state.containerPreferences[entity],
                [operation]: type
              }
            }
          }
          return newState
        })
      },

      setDrawerPosition: (position) => {
        set({ drawerPosition: position })
      },

      setDrawerWidth: (width) => {
        set({ drawerWidth: width })
      },

      resetToDefaults: () => {
        set(DEFAULT_UI_SETTINGS)
      },

      getContainerType: (entity, operation) => {
        const state = get()
        const prefs = state.containerPreferences[entity]

        if (!prefs || !prefs[operation]) {
          const defaultValue = DEFAULT_UI_SETTINGS.containerPreferences[entity]?.[operation] || 'drawer'
          return defaultValue
        }
        
        return prefs[operation]
      }
    }),
    {
      name: 'npm-ui-settings',
      version: 1,
    }
  )
)