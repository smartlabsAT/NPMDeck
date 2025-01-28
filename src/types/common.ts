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