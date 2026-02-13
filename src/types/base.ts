/**
 * Base entity type hierarchy for API entities.
 * Eliminates field duplication across entity interfaces.
 */

/** Common owner type used across entities */
export interface Owner {
  id: number
  email: string
  name: string
  nickname: string
}

/** Absolute minimal base: fields present in ALL entities */
export interface BaseEntity {
  id: number
  created_on: string
  modified_on: string
}

/** Base for entities with owner (all except User) */
export interface OwnedEntity extends BaseEntity {
  owner_user_id: number
  owner?: Owner
}

/** Nginx meta object for host/stream entities */
export interface NginxMeta {
  nginx_online?: boolean
  nginx_err?: string | null
}

/** Let's Encrypt meta fields shared across entities */
export interface LetsEncryptMeta {
  letsencrypt_email?: string
  letsencrypt_agree?: boolean
  dns_challenge?: boolean
  dns_provider?: string
  dns_provider_credentials?: string
  propagation_seconds?: number
}

/** Base for all host entities (ProxyHost, DeadHost, RedirectionHost) */
export interface HostEntity extends OwnedEntity {
  domain_names: string[]
  certificate_id: number
  ssl_forced: boolean
  hsts_enabled: boolean
  hsts_subdomains: boolean
  http2_support: boolean
  advanced_config: string
  enabled: boolean
  meta: NginxMeta
}

/** Toggleable entity (has enable/disable) */
export interface ToggleableEntity extends OwnedEntity {
  enabled: boolean
}
