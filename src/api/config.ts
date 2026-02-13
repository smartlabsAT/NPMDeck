import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { getAuthStoreApi } from '../contexts/AuthContext'
import logger from '../utils/logger'
import { STORAGE_KEYS } from '../constants/storage'

// Get API URL from environment or use default
// In development, Vite will proxy /api requests to the backend
const API_URL = import.meta.env.VITE_API_URL || '/api'

// Token refresh state
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

// Process the queue when token is refreshed
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })
  
  failedQueue = []
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // If sending FormData, remove Content-Type to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh and permission errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean, _queued?: boolean }

    // Handle 403 Forbidden - Permission denied
    if (error.response?.status === 403) {
      // Navigate to forbidden page instead of throwing error
      if (!window.location.pathname.includes('/403')) {
        window.location.href = '/403'
      }
      return Promise.reject(error)
    }

    // Don't try to refresh on login endpoint or if no token exists
    const isLoginRequest = originalRequest.url?.includes('/tokens') && originalRequest.method === 'post'
    const hasToken = !!localStorage.getItem(STORAGE_KEYS.TOKEN)
    
    if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest && hasToken) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token as string}`
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      return new Promise((resolve, reject) => {
        api.get('/tokens')
          .then(({ data }) => {
            const newToken = data.token
            localStorage.setItem(STORAGE_KEYS.TOKEN, newToken)
            
            // Update auth store with new token
            try {
              const authStoreApi = getAuthStoreApi()
              // Get the state and call refreshToken
              const state = authStoreApi.getState() as { refreshToken?: () => Promise<void> }
              if (state && typeof state.refreshToken === 'function') {
                void state.refreshToken()
              }
            } catch {
              // Store might not be initialized during SSR or initial load
              logger.warn('Auth store not initialized yet')
            }
            
            processQueue(null, newToken)
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(api(originalRequest))
          })
          .catch((err) => {
            processQueue(err, null)
            localStorage.removeItem(STORAGE_KEYS.TOKEN)
            localStorage.removeItem(STORAGE_KEYS.USER)
            
            // Redirect to login immediately
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login'
            }
            
            reject(err)
          })
          .finally(() => {
            isRefreshing = false
          })
      })
    }

    return Promise.reject(error)
  }
)

export default api