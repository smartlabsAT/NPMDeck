import { useEffect } from 'react'
import { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useToast } from '../contexts/ToastContext'
import { useAuthStore } from '../stores/authStore'
import { TIMING } from '../constants/timing'
import api from '../api/config'

type RetryableAxiosConfig = InternalAxiosRequestConfig & { _retry?: boolean }

export const useAuthInterceptors = (): void => {
  const { showToast, showError, showInfo } = useToast()
  const authStore = useAuthStore()

  useEffect(() => {
    // Auth store is now available through context

    // Add response interceptor for better error handling
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Skip toast for initial 401 that triggers refresh
        if (error.response?.status === 401 && !(error.config as RetryableAxiosConfig)?._retry) {
          // Don't show toast here, it will be handled by refresh logic
          return Promise.reject(error)
        }

        // Connection error
        if (!error.response) {
          showError('user', 'connect', 'Connection error. Please check your internet connection.')
        }

        // Session expired (after refresh attempt failed)
        if (error.response?.status === 401 && (error.config as RetryableAxiosConfig)?._retry) {
          showToast({
            message: 'Session expired. Please login again.',
            severity: 'error',
            duration: TIMING.SESSION_REFRESH
          })
        }

        return Promise.reject(error)
      }
    )

    // Add request interceptor for loading states
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        // If this is a token refresh request, show loading toast
        if (config.url?.includes('/tokens') && config.method === 'get') {
          const isManualRefresh = authStore.isRefreshing
          if (!isManualRefresh) {
            showInfo('Refreshing session...')
          }
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    return () => {
      api.interceptors.response.eject(responseInterceptor)
      api.interceptors.request.eject(requestInterceptor)
    }
  }, [showToast, showError, showInfo, authStore])
}