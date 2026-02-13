import { useAuthStore } from '../stores/authStore'

/**
 * Wrapper für API-Methoden, der automatisch owner_user_id hinzufügt
 * wenn der User nicht Admin ist und visibility auf 'user' steht
 */
export function withOwnerFilter<T extends Record<string, unknown>>(
  createFn: (data: T) => Promise<T>
): (data: T) => Promise<T> {
  return async (data: T) => {
    const { user, shouldFilterByUser } = useAuthStore.getState()

    // Wenn User-Filterung aktiv ist, füge owner_user_id hinzu
    if (shouldFilterByUser() && user) {
      data = {
        ...data,
        owner_user_id: user.id
      }
    }

    return createFn(data)
  }
}

/**
 * Wrapper für Update-Methoden, der sicherstellt dass User nur eigene Ressourcen updaten können
 */
export function withOwnerCheck<
  T extends { owner_user_id?: number },
  U extends Record<string, unknown>
>(
  getFn: (id: number) => Promise<T>,
  updateFn: (id: number, data: U) => Promise<T>
): (id: number, data: U) => Promise<T> {
  return async (id: number, data: U) => {
    const { user, shouldFilterByUser, isAdmin } = useAuthStore.getState()

    // Admins können alles updaten
    if (isAdmin()) {
      return updateFn(id, data)
    }

    // Wenn User-Filterung aktiv ist, prüfe Ownership
    if (shouldFilterByUser() && user) {
      const resource = await getFn(id)
      if (resource.owner_user_id !== user.id) {
        throw new Error('Sie haben keine Berechtigung, diese Ressource zu bearbeiten')
      }
    }

    return updateFn(id, data)
  }
}

/**
 * Wrapper für Delete-Methoden mit Owner-Check
 */
export function withOwnerDelete<T extends { owner_user_id?: number }>(
  getFn: (id: number) => Promise<T>,
  deleteFn: (id: number) => Promise<void>
): (id: number) => Promise<void> {
  return async (id: number) => {
    const { user, shouldFilterByUser, isAdmin } = useAuthStore.getState()

    // Admins können alles löschen
    if (isAdmin()) {
      return deleteFn(id)
    }

    // Wenn User-Filterung aktiv ist, prüfe Ownership
    if (shouldFilterByUser() && user) {
      const resource = await getFn(id)
      if (resource.owner_user_id !== user.id) {
        throw new Error('Sie haben keine Berechtigung, diese Ressource zu löschen')
      }
    }

    return deleteFn(id)
  }
}
