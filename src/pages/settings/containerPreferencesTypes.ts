import type { EntityPreference, EntityType, ContainerType } from '../../types/uiSettings'
import type { CoreResource } from '../../types/entityTypes'

/**
 * Shared props for the desktop table and mobile card variants of container preferences UI.
 * Table and Cards are mutually exclusive (rendered based on `isMobile`) and use identical props.
 */
export interface ContainerPreferencesProps {
  containerPreferences: Record<string, EntityPreference>
  visibleResources: CoreResource[]
  onSetContainerPreference: (entityKey: EntityType, action: 'view' | 'edit' | 'create', value: ContainerType) => void
  canManage: (resource: CoreResource) => boolean
}
