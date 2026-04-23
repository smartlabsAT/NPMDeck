import { describe, it, expect, vi, beforeEach } from 'vitest'
import { within } from '@testing-library/react'
import { renderWithProviders, screen, waitFor, userEvent, loginAs } from '../../test/utils'
import ProxyHosts from '../../pages/ProxyHosts'
import { mockUser, mockProxyHost } from '../../test/fixtures'

// --- API mocks -----------------------------------------------------------
vi.mock('../../api/proxyHosts', () => ({
  proxyHostsApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
  },
}))

vi.mock('../../api/redirectionHosts', () => ({
  redirectionHostsApi: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
  },
}))

vi.mock('../../api/accessLists', () => ({
  accessListsApi: { getAll: vi.fn().mockResolvedValue([]) },
}))

vi.mock('../../api/certificates', () => ({
  certificatesApi: { getAll: vi.fn().mockResolvedValue([]) },
}))

// Import AFTER vi.mock so we get the typed mock
import { proxyHostsApi } from '../../api/proxyHosts'
import { redirectionHostsApi } from '../../api/redirectionHosts'

// -------------------------------------------------------------------------

const HOST_A = mockProxyHost({ id: 1, domain_names: ['a.test'], enabled: true })
const HOST_B = mockProxyHost({ id: 2, domain_names: ['b.test'], enabled: false })

describe('ProxyHost CRUD integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    loginAs(mockUser())
    vi.mocked(redirectionHostsApi.getAll).mockResolvedValue([])
    vi.mocked(proxyHostsApi.getAll).mockResolvedValue([HOST_A, HOST_B])
    vi.mocked(proxyHostsApi.delete).mockResolvedValue(undefined)
    vi.mocked(proxyHostsApi.enable).mockResolvedValue(undefined)
    vi.mocked(proxyHostsApi.disable).mockResolvedValue(undefined)
  })

  it('loads and displays proxy hosts', async () => {
    renderWithProviders(<ProxyHosts />, { initialRoute: '/hosts/proxy' })

    await waitFor(() => {
      expect(screen.getByText('a.test')).toBeInTheDocument()
      expect(screen.getByText('b.test')).toBeInTheDocument()
    })
  })

  it('calls proxyHostsApi.getAll on mount', async () => {
    renderWithProviders(<ProxyHosts />, { initialRoute: '/hosts/proxy' })

    await waitFor(() => {
      expect(proxyHostsApi.getAll).toHaveBeenCalled()
    })
  })

  it('shows delete confirmation and calls api.delete on confirm', async () => {
    vi.mocked(proxyHostsApi.getAll).mockResolvedValue([HOST_A])
    renderWithProviders(<ProxyHosts />, { initialRoute: '/hosts/proxy' })

    // Wait for data to load
    await waitFor(() => expect(screen.getByText('a.test')).toBeInTheDocument())

    // Locate the delete button via data-testid scoped to the 'a.test' row.
    // MUI renders icon components with a data-testid matching the icon name,
    // so we find the row's <tr> element and query within it for the DeleteIcon.
    const row = screen.getByText('a.test').closest('tr') as HTMLElement
    const deleteIcon = within(row).getByTestId('DeleteIcon')
    const deleteButton = deleteIcon.closest('button')
    expect(deleteButton).toBeDefined()
    await userEvent.click(deleteButton as HTMLElement)

    // ConfirmDialog renders with confirmText="Delete"
    const confirmBtn = await screen.findByRole('button', { name: /^delete$/i })
    await userEvent.click(confirmBtn)

    await waitFor(() => {
      expect(proxyHostsApi.delete).toHaveBeenCalled()
    })
  })

  it('shows error state when load fails', async () => {
    vi.mocked(proxyHostsApi.getAll).mockRejectedValue(new Error('Network error'))

    renderWithProviders(<ProxyHosts />, { initialRoute: '/hosts/proxy' })

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
  })
})
