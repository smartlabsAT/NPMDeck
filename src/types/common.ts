import { User } from '../api/users'
import { Certificate } from '../api/certificates'
import { AccessList } from '../api/accessLists'

// Common owner type used across entities
export type Owner = Pick<User, 'id' | 'email' | 'name' | 'nickname'>

// Extended certificate type with proper relations
export interface CertificateWithRelations extends Omit<Certificate, 'owner'> {
  owner?: Owner
}

// Extended access list type with proper relations
export interface AccessListWithRelations extends Omit<AccessList, 'owner'> {
  owner?: Owner
}

// Common API error response
export interface ApiError {
  error?: {
    message: string
    code?: string
  }
  message?: string
}

// Axios error response structure
export interface AxiosErrorResponse {
  response?: {
    data?: {
      error?: {
        message: string
        code?: string
      }
      message?: string
    }
    status?: number
    statusText?: string
  }
  message?: string
  code?: string
}

// Import/Export data types
export interface ImportValidationData {
  version?: string
  type?: string
  data?: unknown
  exported_at?: string
}

// Color types for theme
export type ColorVariant = 'error' | 'warning' | 'success' | 'info' | 'primary' | 'secondary'

// Certificate status types
export interface CertificateStatus {
  color: ColorVariant
  text: string
  icon: React.ComponentType
}

// Logger interface
export interface Logger {
  log: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
  group: (...args: unknown[]) => void
  groupEnd: () => void
  table: (data: Record<string, unknown> | unknown[]) => void
}

// Generic API response types
export interface ApiResponse<T = unknown> {
  data?: T
  message?: string
  success?: boolean
}

// Error handling types
export interface ApiErrorData {
  message: string
  code?: string
}

export interface ErrorWithResponse {
  response?: {
    data?: {
      error?: ApiErrorData
      message?: string
    }
    status?: number
    statusText?: string
  }
  message?: string
  code?: string
}

// Helper function to safely extract error message
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error
  
  const err = error as ErrorWithResponse
  return (
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.message ||
    'An unexpected error occurred'
  )
}

// Certificate with host relations
export interface CertificateHostRelation {
  id: number
  domain_names: string[]
  enabled: boolean
  // Missing properties that are being used
  forward_scheme?: string
  forward_host?: string
  forward_port?: number
  forward_domain_name?: string
}

export interface CertificateWithHosts extends Certificate {
  proxy_hosts?: CertificateHostRelation[]
  redirection_hosts?: CertificateHostRelation[]
  dead_hosts?: CertificateHostRelation[]
}

// React event types
export type ChangeEvent<T = HTMLInputElement> = React.ChangeEvent<T>
export type MouseEvent<T = HTMLElement> = React.MouseEvent<T>
export type FormEvent<T = HTMLFormElement> = React.FormEvent<T>
export type KeyboardEvent<T = HTMLElement> = React.KeyboardEvent<T>

// Common handler types
export type ChangeHandler<T = HTMLInputElement> = (event: ChangeEvent<T>) => void
export type ClickHandler<T = HTMLElement> = (event: MouseEvent<T>) => void
export type SubmitHandler<T = HTMLFormElement> = (event: FormEvent<T>) => void

// Pagination types
export interface PaginationState {
  page: number
  rowsPerPage: number
}

// Sort types
export type SortDirection = 'asc' | 'desc'

export interface SortState<T> {
  orderBy: T
  order: SortDirection
}