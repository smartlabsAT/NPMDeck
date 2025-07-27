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
        set(state => ({
          containerPreferences: {
            ...state.containerPreferences,
            [entity]: {
              ...state.containerPreferences[entity],
              [operation]: type
            }
          }
        }))
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
        const prefs = get().containerPreferences[entity]
        if (!prefs || !prefs[operation]) {
          return DEFAULT_UI_SETTINGS.containerPreferences[entity]?.[operation] || 'dialog'
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