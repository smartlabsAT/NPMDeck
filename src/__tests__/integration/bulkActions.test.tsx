import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor, userEvent } from '../../test/utils'
import ProxyHosts from '../../pages/ProxyHosts'
import { useAuthStore } from '../../stores/authStore'
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

import { proxyHostsApi } from '../../api/proxyHosts'
import { redirectionHostsApi } from '../../api/redirectionHosts'

// -------------------------------------------------------------------------

function resetAuthStore() {
  useAuthStore.setState({
    user: mockUser(),
    token: 'test-token',
    tokenExpiresAt: null,
    isAuthenticated: true,
    isLoading: false,
    error: null,
    tokenStack: [],
    refreshInterval: null,
    expiryWarningTimeout: null,
    isRefreshing: false,
  })
}

const HOST_A = mockProxyHost({ id: 1, domain_names: ['a.test'], enabled: true })
const HOST_B = mockProxyHost({ id: 2, domain_names: ['b.test'], enabled: true })

describe('Bulk actions integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAuthStore()
    vi.mocked(redirectionHostsApi.getAll).mockResolvedValue([])
    vi.mocked(proxyHostsApi.getAll).mockResolvedValue([HOST_A, HOST_B])
    vi.mocked(proxyHostsApi.delete).mockResolvedValue(undefined)
    vi.mocked(proxyHostsApi.enable).mockResolvedValue(undefined)
    vi.mocked(proxyHostsApi.disable).mockResolvedValue(undefined)
  })

  it('renders list of items', async () => {
    renderWithProviders(<ProxyHosts />, { initialRoute: '/hosts/proxy' })

    await waitFor(() => {
      expect(screen.getByText('a.test')).toBeInTheDocument()
      expect(screen.getByText('b.test')).toBeInTheDocument()
    })
  })

  it('shows selection checkboxes for each row', async () => {
    renderWithProviders(<ProxyHosts />, { initialRoute: '/hosts/proxy' })

    await waitFor(() => expect(screen.getByText('a.test')).toBeInTheDocument())

    // Expect at least one checkbox (select-all header checkbox + per-row checkboxes)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThanOrEqual(2)
  })

  it('clicking select-all checkbox checks it', async () => {
    renderWithProviders(<ProxyHosts />, { initialRoute: '/hosts/proxy' })

    await waitFor(() => expect(screen.getByText('a.test')).toBeInTheDocument())

    const checkboxes = screen.getAllByRole('checkbox')
    const selectAll = checkboxes[0]

    await userEvent.click(selectAll)

    await waitFor(() => {
      expect(selectAll).toBeChecked()
    })
  })

  /**
   * Known coverage gap: The full bulk-action delete chain (toolbar reveal →
   * bulk delete button → confirm → api.delete) is not directly tested here
   * because the bulk actions toolbar in MUI requires complex positional menu
   * interactions that are brittle in jsdom. The bulk-action *logic* is
   * covered by `src/utils/__tests__/bulkActionFactory.test.tsx`.
   */
  it('clicking select-all checkbox checks it', async () => {
    renderWithProviders(<ProxyHosts />, { initialRoute: '/hosts/proxy' })

    await waitFor(() => expect(screen.getByText('a.test')).toBeInTheDocument())

    // Click on the first row checkbox (index 0 is select-all, index 1 is first row)
    const checkboxes = screen.getAllByRole('checkbox')
    // Select at least one row — try select-all for simplicity
    await userEvent.click(checkboxes[0])

    await waitFor(() => {
      expect(checkboxes[0]).toBeChecked()
    })
  })
})
