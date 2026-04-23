import { describe, it, expect, beforeEach } from 'vitest'
import { renderWithProviders, screen, resetAuthStore } from '../../test/utils'
import PermissionButton from '../PermissionButton'
import { useAuthStore } from '../../stores/authStore'
import { mockUser, mockNonAdminUser } from '../../test/fixtures'

describe('PermissionButton', () => {
  beforeEach(() => {
    resetAuthStore()
  })

  it('renders enabled when user has permission', () => {
    useAuthStore.setState({ user: mockUser(), isAuthenticated: true })
    renderWithProviders(
      <PermissionButton resource="proxy_hosts" permissionAction="edit">
        Edit
      </PermissionButton>,
    )
    expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled()
  })

  it('is disabled when user lacks permission', () => {
    useAuthStore.setState({
      user: mockNonAdminUser({
        permissions: {
          visibility: 'user',
          proxy_hosts: 'view',
          redirection_hosts: 'hidden',
          dead_hosts: 'hidden',
          streams: 'hidden',
          access_lists: 'hidden',
          certificates: 'hidden',
        },
      }),
      isAuthenticated: true,
    })
    renderWithProviders(
      <PermissionButton resource="proxy_hosts" permissionAction="edit">
        Edit
      </PermissionButton>,
    )
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
  })

  it('is hidden when hideWhenUnauthorized and no permission', () => {
    useAuthStore.setState({
      user: mockNonAdminUser({
        permissions: {
          visibility: 'user',
          proxy_hosts: 'view',
          redirection_hosts: 'hidden',
          dead_hosts: 'hidden',
          streams: 'hidden',
          access_lists: 'hidden',
          certificates: 'hidden',
        },
      }),
      isAuthenticated: true,
    })
    renderWithProviders(
      <PermissionButton resource="proxy_hosts" permissionAction="edit" hideWhenUnauthorized>
        Edit
      </PermissionButton>,
    )
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  })

  it('respects explicit disabled prop even with permission', () => {
    useAuthStore.setState({ user: mockUser(), isAuthenticated: true })
    renderWithProviders(
      <PermissionButton resource="proxy_hosts" permissionAction="edit" disabled>
        Edit
      </PermissionButton>,
    )
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
  })

  it('falls back to level-based permission check when no permissionAction', () => {
    useAuthStore.setState({
      user: mockNonAdminUser({
        permissions: {
          visibility: 'user',
          proxy_hosts: 'view',
          redirection_hosts: 'hidden',
          dead_hosts: 'hidden',
          streams: 'hidden',
          access_lists: 'hidden',
          certificates: 'hidden',
        },
      }),
      isAuthenticated: true,
    })
    renderWithProviders(
      <PermissionButton resource="proxy_hosts" level="view">
        View
      </PermissionButton>,
    )
    expect(screen.getByRole('button', { name: 'View' })).toBeEnabled()
  })

  it('defaults to level=manage when neither level nor permissionAction provided', () => {
    useAuthStore.setState({
      user: mockNonAdminUser({
        permissions: {
          visibility: 'user',
          proxy_hosts: 'view',
          redirection_hosts: 'hidden',
          dead_hosts: 'hidden',
          streams: 'hidden',
          access_lists: 'hidden',
          certificates: 'hidden',
        },
      }),
      isAuthenticated: true,
    })
    renderWithProviders(
      <PermissionButton resource="proxy_hosts">Manage</PermissionButton>,
    )
    expect(screen.getByRole('button', { name: 'Manage' })).toBeDisabled()
  })
})
