import { useEffect, useCallback, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../contexts/ToastContext'
import { Alert, Button, Slide, LinearProgress } from '@mui/material'
import { useAuthInterceptors } from '../hooks/useAuthInterceptors'
import { TIMING } from '../constants/timing'
import { Z_INDEX } from '../constants/layout'

export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const { loadUser, isAuthenticated, refreshToken, isRefreshing } = useAuthStore()
  const { showToast, showInfo } = useToast()
  const [showExpiryWarning, setShowExpiryWarning] = useState(false)
  
  // Setup auth interceptors
  useAuthInterceptors()

  // Handle token expiry warning
  const handleTokenExpiryWarning = useCallback((_event: Event) => {
    setShowExpiryWarning(true)
  }, [])

  const handleRefreshToken = useCallback(async () => {
    setShowExpiryWarning(false)
    showInfo('Refreshing session...')
    await refreshToken()
    showToast({
      message: 'Session refreshed successfully',
      severity: 'success',
      duration: TIMING.TOAST_SUCCESS
    })
  }, [refreshToken, showInfo, showToast])

  useEffect(() => {
    if (isAuthenticated) {
      loadUser()
    }
  }, [isAuthenticated, loadUser])

  useEffect(() => {
    // Listen for token expiry warnings
    window.addEventListener('token-expiry-warning', handleTokenExpiryWarning)
    
    return () => {
      window.removeEventListener('token-expiry-warning', handleTokenExpiryWarning)
    }
  }, [handleTokenExpiryWarning])

  return (
    <>
      {/* Global loading indicator for token refresh */}
      {isRefreshing && (
        <LinearProgress
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: Z_INDEX.TOKEN_REFRESH
          }}
        />
      )}
      {children}
      {/* Custom token expiry warning alert */}
      <Slide direction="down" in={showExpiryWarning} mountOnEnter unmountOnExit>
        <Alert
          severity="warning"
          variant="filled"
          onClose={() => setShowExpiryWarning(false)}
          action={
            <Button color="inherit" size="small" onClick={handleRefreshToken}>
              Refresh Now
            </Button>
          }
          sx={{
            position: 'fixed',
            top: 64,
            right: 24,
            zIndex: Z_INDEX.EXPIRY_WARNING,
            minWidth: 300,
            boxShadow: 3
          }}
        >
          Your session will expire soon
        </Alert>
      </Slide>
    </>
  )
}