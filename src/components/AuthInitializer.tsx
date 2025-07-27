import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'

export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const { loadUser, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      loadUser()
    }
  }, [isAuthenticated, loadUser])

  return <>{children}</>
}