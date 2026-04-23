import { describe, it, expect, beforeEach } from 'vitest'
import { renderWithProviders, screen, userEvent } from '../../test/utils'
import EditIcon from '@mui/icons-material/Edit'
import PermissionIconButton from '../PermissionIconButton'
import { useAuthStore } from '../../stores/authStore'
import { mockUser, mockNonAdminUser } from '../../test/fixtures'

function resetAuthStore() {
  useAuthStore.setState({
    user: null,
    token: null,
    tokenExpiresAt: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    tokenStack: [],
    refreshInterval: null,
    expiryWarningTimeout: null,
    isRefreshing: false,
  })
}

describe('PermissionIconButton', () => {
  beforeEach(() => {
    resetAuthStore()
  })

  it('renders enabled when user has permission', () => {
    useAuthStore.setState({ user: mockUser(), isAuthenticated: true })
    renderWithProviders(
      <PermissionIconButton
        resource="proxy_hosts"
        permissionAction="edit"
        aria-label="Edit"
      >
        <EditIcon />
      </PermissionIconButton>,
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
      <PermissionIconButton
        resource="proxy_hosts"
        permissionAction="edit"
        aria-label="Edit"
      >
        <EditIcon />
      </PermissionIconButton>,
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
      <PermissionIconButton
        resource="proxy_hosts"
        permissionAction="edit"
        hideWhenUnauthorized
        aria-label="Edit"
      >
        <EditIcon />
      </PermissionIconButton>,
    )
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  })

  it('respects explicit disabled prop even with permission', () => {
    useAuthStore.setState({ user: mockUser(), isAuthenticated: true })
    renderWithProviders(
      <PermissionIconButton
        resource="proxy_hosts"
        permissionAction="edit"
        disabled
        aria-label="Edit"
      >
        <EditIcon />
      </PermissionIconButton>,
    )
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
  })

  it('shows tooltipTitle when user has permission', async () => {
    useAuthStore.setState({ user: mockUser(), isAuthenticated: true })
    renderWithProviders(
      <PermissionIconButton
        resource="proxy_hosts"
        permissionAction="edit"
        tooltipTitle="Edit proxy host"
        aria-label="Edit"
      >
        <EditIcon />
      </PermissionIconButton>,
    )
    // Tooltip wraps the button when tooltipTitle is present
    const button = screen.getByRole('button', { name: 'Edit' })
    await userEvent.hover(button)
    // Tooltip text is rendered in the DOM after hover
    expect(await screen.findByText('Edit proxy host')).toBeInTheDocument()
  })

  it('falls back to level=manage and disables when no level/action provided and user lacks manage', () => {
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
      <PermissionIconButton resource="proxy_hosts" aria-label="Manage">
        <EditIcon />
      </PermissionIconButton>,
    )
    expect(screen.getByRole('button', { name: 'Manage' })).toBeDisabled()
  })
})
