import { useState, useEffect, useOptimistic, startTransition, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getErrorMessage } from '../types/common'
import { usePermissions } from './usePermissions'
import { useFilteredData } from './useFilteredData'
import { useToast } from '../contexts/ToastContext'
import type { ToastEntityType } from '../types/entityTypes'
import type { CoreResource } from '../types/entityTypes'
import type { ToggleableEntity } from '../types/base'
import logger from '../utils/logger'

interface EntityApi<T> {
  getAll: (expand?: string[]) => Promise<T[]>
  delete: (id: number) => Promise<void>
  enable: (id: number) => Promise<void>
  disable: (id: number) => Promise<void>
}

interface AdditionalLoader<TExtra> {
  load: () => Promise<TExtra>
}

export interface EntityCrudConfig<T extends ToggleableEntity, TExtra = undefined> {
  api: EntityApi<T>
  expand: string[]
  basePath: string
  entityType: ToastEntityType
  resource: CoreResource
  getDisplayName: (item: T) => string
  entityLabel: string
  additionalLoader?: AdditionalLoader<TExtra>
}

export interface EntityCrudReturn<T extends ToggleableEntity, TExtra = undefined> {
  items: T[]
  optimisticItems: T[]
  visibleItems: T[]
  loading: boolean
  error: string | null
  additionalData: TExtra | undefined
  drawerOpen: boolean
  editingItem: T | null
  deleteDialogOpen: boolean
  itemToDelete: T | null
  detailsDialogOpen: boolean
  viewingItem: T | null
  handleToggleEnabled: (item: T) => void
  handleEdit: (item: T) => void
  handleView: (item: T) => void
  handleAdd: () => void
  handleDelete: (item: T) => void
  handleConfirmDelete: () => Promise<void>
  closeDrawer: () => void
  closeDetailsDialog: () => void
  closeDeleteDialog: () => void
  loadItems: () => Promise<void>
  canManage: boolean
}

export function useEntityCrud<T extends ToggleableEntity, TExtra = undefined>(
  config: EntityCrudConfig<T, TExtra>
): EntityCrudReturn<T, TExtra> {
  const { api, expand, basePath, entityType, resource, getDisplayName, entityLabel, additionalLoader } = config

  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const { canManage: canManageResource } = usePermissions()
  const { showSuccess, showError } = useToast()

  // State
  const [items, setItems] = useState<T[]>([])
  const [additionalData, setAdditionalData] = useState<TExtra | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [optimisticItems, setOptimisticItem] = useOptimistic(
    items,
    (state, toggledItem: { id: number; enabled: boolean }) =>
      state.map(item =>
        item.id === toggledItem.id ? { ...item, enabled: toggledItem.enabled } : item
      )
  )

  // Dialogs
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<T | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [viewingItem, setViewingItem] = useState<T | null>(null)

  const canManage = canManageResource(resource)

  const loadItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (additionalLoader) {
        const [mainData, extraData] = await Promise.all([
          api.getAll(expand),
          additionalLoader.load()
        ])
        setItems(mainData)
        setAdditionalData(extraData)
      } else {
        const data = await api.getAll(expand)
        setItems(data)
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [api, expand, additionalLoader])

  useEffect(() => {
    loadItems()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: load once on mount
  }, [])

  // Handle URL parameter for editing or viewing
  useEffect(() => {
    if (location.pathname.includes('/new') && canManage) {
      setEditingItem(null)
      setDrawerOpen(true)
      setDetailsDialogOpen(false)
      setViewingItem(null)
    } else if (id) {
      // Wait for items to load
      if (loading) {
        return
      }

      const item = items.find(h => h.id === parseInt(id))
      if (item) {
        if (location.pathname.includes('/edit') && canManage) {
          setEditingItem(item)
          setDrawerOpen(true)
          setDetailsDialogOpen(false)
          setViewingItem(null)
        } else if (location.pathname.includes('/view')) {
          setViewingItem(item)
          setDetailsDialogOpen(true)
          setDrawerOpen(false)
          setEditingItem(null)
        }
      } else if (items.length > 0) {
        // Item not found after loading (but other items exist)
        logger.error(`${entityLabel} with id ${id} not found`)
        navigate(basePath)
      }
      // If items.length === 0, we'll wait for items to load
    } else {
      // No ID in URL, close dialogs
      setDrawerOpen(false)
      setEditingItem(null)
      setDetailsDialogOpen(false)
      setViewingItem(null)
    }
  }, [id, items, location.pathname, navigate, loading, canManage, basePath, entityLabel])

  const handleToggleEnabled = useCallback((item: T) => {
    startTransition(async () => {
      setOptimisticItem({ id: item.id, enabled: !item.enabled })

      try {
        const displayName = getDisplayName(item)

        if (item.enabled) {
          await api.disable(item.id)
          showSuccess(entityType, 'disabled', displayName, item.id)
        } else {
          await api.enable(item.id)
          showSuccess(entityType, 'enabled', displayName, item.id)
        }
        await loadItems()
      } catch (err: unknown) {
        const displayName = getDisplayName(item)
        showError(entityType, item.enabled ? 'disable' : 'enable', err instanceof Error ? err.message : 'Unknown error', displayName, item.id)
        setError(getErrorMessage(err))
        await loadItems()
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- setOptimisticItem is stable (React dispatch)
  }, [api, entityType, getDisplayName, showSuccess, showError, loadItems])

  const handleEdit = useCallback((item: T) => {
    navigate(`${basePath}/${item.id}/edit`)
  }, [navigate, basePath])

  const handleView = useCallback((item: T) => {
    navigate(`${basePath}/${item.id}/view`)
  }, [navigate, basePath])

  const handleAdd = useCallback(() => {
    setEditingItem(null)
    navigate(`${basePath}/new`)
  }, [navigate, basePath])

  const handleDelete = useCallback((item: T) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return

    try {
      await api.delete(itemToDelete.id)
      showSuccess(entityType, 'deleted', getDisplayName(itemToDelete), itemToDelete.id)
      await loadItems()
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    } catch (err: unknown) {
      showError(entityType, 'delete', err instanceof Error ? err.message : 'Unknown error', getDisplayName(itemToDelete), itemToDelete.id)
      logger.error(`Failed to delete ${entityLabel}:`, err)
    }
  }, [itemToDelete, api, entityType, getDisplayName, showSuccess, showError, loadItems, entityLabel])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    navigate(basePath)
  }, [navigate, basePath])

  const closeDetailsDialog = useCallback(() => {
    setDetailsDialogOpen(false)
    if (id) {
      navigate(basePath)
    }
  }, [navigate, basePath, id])

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false)
    setItemToDelete(null)
  }, [])

  // Apply visibility filtering
  const visibleItems = useFilteredData(optimisticItems)

  return {
    items,
    optimisticItems,
    visibleItems,
    loading,
    error,
    additionalData,
    drawerOpen,
    editingItem,
    deleteDialogOpen,
    itemToDelete,
    detailsDialogOpen,
    viewingItem,
    handleToggleEnabled,
    handleEdit,
    handleView,
    handleAdd,
    handleDelete,
    handleConfirmDelete,
    closeDrawer,
    closeDetailsDialog,
    closeDeleteDialog,
    loadItems,
    canManage,
  }
}
