import { useAuthStore } from '../stores/authStore'
import type { User } from '../api/users'

/**
 * Reset the Zustand auth store to its initial unauthenticated state.
 * Also clears any running timers (token refresh interval, expiry warning timeout)
 * to prevent real timer leaks in tests.
 */
export function resetAuthStore(): void {
  const state = useAuthStore.getState()
  state.stopTokenRefresh()
  state.clearExpiryWarning()
  useAuthStore.setState({
    user: null,
    token: null,
    tokenExpiresAt: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    tokenStack: [],
    refreshInterval: null,
    expiryWarningTimeout: null,
    isRefreshing: false,
  })
}

/**
 * Set the store to an authenticated state with the given user.
 * Convenience for tests that need a logged-in context.
 */
export function loginAs(user: User, token = 'test-token'): void {
  resetAuthStore()
  useAuthStore.setState({
    user,
    token,
    isAuthenticated: true,
  })
}
