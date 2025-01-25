import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

// Get API URL from environment or use default
// In development, Vite will proxy /api requests to the backend
const API_URL = import.meta.env.VITE_API_URL || '/api'

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
    const token = localStorage.getItem('npm_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config

    // Don't try to refresh on login endpoint or if no token exists
    const isLoginRequest = originalRequest.url?.includes('/tokens') && originalRequest.method === 'post'
    const hasToken = !!localStorage.getItem('npm_token')
    
    if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest && hasToken) {
      originalRequest._retry = true

      try {
        // Try to refresh token
        const refreshResponse = await api.get('/tokens')
        const newToken = refreshResponse.data.token
        
        // Save new token
        localStorage.setItem('npm_token', newToken)
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('npm_token')
        localStorage.removeItem('npm_user')
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
        
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api