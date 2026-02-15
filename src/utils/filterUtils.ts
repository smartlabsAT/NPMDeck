import type { FilterValue } from '../components/DataTable/types'

/** Entity with SSL-related fields for filtering */
interface SslFilterableEntity {
  certificate_id: number | null
  ssl_forced: boolean | number
}

/** Entity with enabled field for status filtering */
interface StatusFilterableEntity {
  enabled: boolean
}

/**
 * Filters an entity by SSL status. Returns false if the entity should be excluded.
 * Shared across ProxyHosts, RedirectionHosts, and DeadHosts filter logic.
 */
export function filterBySsl(item: SslFilterableEntity, sslValue: FilterValue): boolean {
  if (!sslValue || sslValue === 'all') return true
  if (sslValue === 'forced' && (!item.certificate_id || !item.ssl_forced)) return false
  if (sslValue === 'optional' && (!item.certificate_id || item.ssl_forced)) return false
  if (sslValue === 'disabled' && item.certificate_id) return false
  return true
}

/**
 * Filters an entity by enabled/disabled status. Returns false if the entity should be excluded.
 * Shared across ProxyHosts, RedirectionHosts, and DeadHosts filter logic.
 */
export function filterByStatus(item: StatusFilterableEntity, statusValue: FilterValue): boolean {
  if (!statusValue || statusValue === 'all') return true
  if (statusValue === 'enabled' && !item.enabled) return false
  if (statusValue === 'disabled' && item.enabled) return false
  return true
}
