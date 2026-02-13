import type { EntityResource } from './entityTypes'

export type ContainerType = 'drawer' | 'dialog'
export type DrawerPosition = 'left' | 'right'
export type Operation = 'create' | 'edit' | 'view'
export type EntityType = EntityResource

export interface EntityPreference {
  create?: ContainerType
  edit?: ContainerType
  view?: ContainerType
}

export interface UISettings {
  containerPreferences: {
    [key in EntityType]?: EntityPreference
  }
  drawerPosition: DrawerPosition
  drawerWidth: number
}

export const DEFAULT_UI_SETTINGS: UISettings = {
  containerPreferences: {
    proxy_hosts: { create: 'drawer', edit: 'drawer', view: 'dialog' },
    redirection_hosts: { create: 'drawer', edit: 'drawer', view: 'dialog' },
    dead_hosts: { create: 'drawer', edit: 'drawer', view: 'dialog' },
    streams: { create: 'drawer', edit: 'drawer', view: 'dialog' },
    access_lists: { create: 'drawer', edit: 'drawer', view: 'dialog' },
    certificates: { create: 'drawer', edit: 'drawer', view: 'dialog' },
    users: { create: 'drawer', edit: 'drawer', view: 'dialog' }
  },
  drawerPosition: 'right',
  drawerWidth: 600
}

// Entity display names for UI
export const ENTITY_DISPLAY_NAMES: Record<EntityType, string> = {
  proxy_hosts: 'Proxy Hosts',
  redirection_hosts: 'Redirection Hosts',
  dead_hosts: '404 Hosts',
  streams: 'Streams',
  access_lists: 'Access Lists',
  certificates: 'SSL Certificates',
  users: 'Users'
}