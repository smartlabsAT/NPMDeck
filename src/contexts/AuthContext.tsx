import React, { createContext, useContext, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import type { StoreApi } from 'zustand'

// Extract the store type from useAuthStore
export type AuthStore = ReturnType<typeof useAuthStore>

// Create context for the auth store API
const AuthStoreContext = createContext<StoreApi<AuthStore> | null>(null)

// Provider component
export const AuthStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get the store API from zustand
  const storeApi = (useAuthStore as any).api
  
  // Initialize the global store API on mount
  useEffect(() => {
    setAuthStoreApi(storeApi)
    
    return () => {
      // Clean up on unmount
      authStoreApi = null
    }
  }, [storeApi])
  
  return (
    <AuthStoreContext.Provider value={storeApi}>
      {children}
    </AuthStoreContext.Provider>
  )
}

// Hook to access the store API outside of React components
export const useAuthStoreApi = () => {
  const context = useContext(AuthStoreContext)
  if (!context) {
    throw new Error('useAuthStoreApi must be used within AuthStoreProvider')
  }
  return context
}

// Export a function that can be used in non-React contexts (like axios interceptors)
// This will be initialized by the provider
let authStoreApi: StoreApi<AuthStore> | null = null

export const setAuthStoreApi = (api: StoreApi<AuthStore>) => {
  authStoreApi = api
}

export const getAuthStoreApi = (): StoreApi<AuthStore> => {
  if (!authStoreApi) {
    throw new Error('Auth store API not initialized. Make sure AuthStoreProvider is mounted.')
  }
  return authStoreApi
}