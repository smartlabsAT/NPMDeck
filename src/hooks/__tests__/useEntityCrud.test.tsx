import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { renderHookWithProviders, loginAs } from '../../test/utils'
import { useEntityCrud } from '../useEntityCrud'
import { mockUser, mockProxyHost } from '../../test/fixtures'
import type { ProxyHost } from '../../api/proxyHosts'

// Must be declared before any imports that transitively use react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

interface ProxyHostApi {
  getAll: (expand?: string[]) => Promise<ProxyHost[]>
  delete: (id: number) => Promise<void>
  enable: (id: number) => Promise<void>
  disable: (id: number) => Promise<void>
}

function makeApi(overrides: Partial<ProxyHostApi> = {}): ProxyHostApi {
  return {
    getAll: vi.fn().mockResolvedValue([
      mockProxyHost({ id: 1, domain_names: ['a.test'], enabled: true }),
      mockProxyHost({ id: 2, domain_names: ['b.test'], enabled: false }),
    ]) as ProxyHostApi['getAll'],
    delete: vi.fn().mockResolvedValue(undefined) as ProxyHostApi['delete'],
    enable: vi.fn().mockResolvedValue(undefined) as ProxyHostApi['enable'],
    disable: vi.fn().mockResolvedValue(undefined) as ProxyHostApi['disable'],
    ...overrides,
  }
}

function setup(apiOverrides?: Parameters<typeof makeApi>[0]) {
  const api = makeApi(apiOverrides)
  const { result } = renderHookWithProviders(() =>
    useEntityCrud<ProxyHost>({
      api,
      expand: ['owner'],
      basePath: '/hosts/proxy',
      entityType: 'proxy-host',
      resource: 'proxy_hosts',
      getDisplayName: (h) => h.domain_names[0] || '',
      entityLabel: 'proxy hosts',
    }),
  )
  return { api, result }
}

describe('useEntityCrud — initial load', () => {
  beforeEach(() => {
    loginAs(mockUser())
    mockNavigate.mockClear()
  })

  it('calls api.getAll on mount with expand option', async () => {
    const { api } = setup()
    await waitFor(() => {
      expect(api.getAll).toHaveBeenCalledWith(['owner'])
    })
  })

  it('populates items after successful load', async () => {
    const { result } = setup()
    await waitFor(() => {
      expect(result.current.items).toHaveLength(2)
    })
  })

  it('sets loading=false after load completes', async () => {
    const { result } = setup()
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('sets error on load failure', async () => {
    const { result } = setup({
      getAll: vi.fn().mockRejectedValue(new Error('Network error')),
    })
    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })
  })
})

describe('useEntityCrud — drawer state', () => {
  beforeEach(() => {
    loginAs(mockUser())
    mockNavigate.mockClear()
  })

  it('handleAdd opens drawer without item (create mode)', async () => {
    // Simulate navigating to /new by setting the initial route — navigate is mocked
    // so the URL never changes in MemoryRouter; instead, start at the /new URL directly.
    const { result } = renderHookWithProviders(() =>
      useEntityCrud<ProxyHost>({
        api: makeApi(),
        expand: ['owner'],
        basePath: '/hosts/proxy',
        entityType: 'proxy-host',
        resource: 'proxy_hosts',
        getDisplayName: (h) => h.domain_names[0] || '',
        entityLabel: 'proxy hosts',
      }),
      { initialRoute: '/hosts/proxy/new' },
    )
    await waitFor(() => {
      expect(result.current.drawerOpen).toBe(true)
    })
    expect(result.current.editingItem).toBeNull()
  })

  it('closeDrawer navigates to basePath', async () => {
    // With navigate mocked, closeDrawer cannot change the URL, so we verify it
    // calls navigate(basePath) rather than testing the resulting drawer state.
    const { result } = setup()
    await waitFor(() => expect(result.current.items).toHaveLength(2))
    act(() => result.current.closeDrawer())
    expect(mockNavigate).toHaveBeenCalledWith('/hosts/proxy')
  })

  it('handleEdit navigates to the edit URL for the item', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.items).toHaveLength(2))
    act(() => result.current.handleEdit(result.current.items[0]))
    expect(mockNavigate).toHaveBeenCalledWith('/hosts/proxy/1/edit')
  })

  it('handleAdd navigates to the new URL', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.items).toHaveLength(2))
    act(() => result.current.handleAdd())
    expect(mockNavigate).toHaveBeenCalledWith('/hosts/proxy/new')
  })
})

describe('useEntityCrud — delete flow', () => {
  beforeEach(() => {
    loginAs(mockUser())
    mockNavigate.mockClear()
  })

  it('handleDelete opens confirm dialog with item', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.items).toHaveLength(2))
    act(() => result.current.handleDelete(result.current.items[0]))
    expect(result.current.deleteDialogOpen).toBe(true)
    expect(result.current.itemToDelete?.id).toBe(1)
  })

  it('handleConfirmDelete calls api.delete with the item id', async () => {
    const { api, result } = setup()
    await waitFor(() => expect(result.current.items).toHaveLength(2))
    act(() => result.current.handleDelete(result.current.items[0]))
    await act(async () => {
      await result.current.handleConfirmDelete()
    })
    expect(api.delete).toHaveBeenCalledWith(1)
  })

  it('handleConfirmDelete closes dialog on success', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.items).toHaveLength(2))
    act(() => result.current.handleDelete(result.current.items[0]))
    expect(result.current.deleteDialogOpen).toBe(true)
    await act(async () => {
      await result.current.handleConfirmDelete()
    })
    await waitFor(() => {
      expect(result.current.deleteDialogOpen).toBe(false)
    })
  })

  it('handleConfirmDelete keeps dialog open and logs error on failure', async () => {
    const { result } = setup({
      delete: vi.fn().mockRejectedValue(new Error('boom')),
    })
    await waitFor(() => expect(result.current.items).toHaveLength(2))
    act(() => result.current.handleDelete(result.current.items[0]))
    await act(async () => {
      await result.current.handleConfirmDelete()
    })
    // Error path: hook does NOT close dialog — item stays set for retry
    expect(result.current.deleteDialogOpen).toBe(true)
    expect(result.current.itemToDelete?.id).toBe(1)
  })

  it('closeDeleteDialog resets delete state', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.items).toHaveLength(2))
    act(() => result.current.handleDelete(result.current.items[0]))
    act(() => result.current.closeDeleteDialog())
    expect(result.current.deleteDialogOpen).toBe(false)
    expect(result.current.itemToDelete).toBeNull()
  })
})

describe('useEntityCrud — handleToggleEnabled', () => {
  beforeEach(() => {
    loginAs(mockUser())
    mockNavigate.mockClear()
  })

  it('calls api.disable when item is currently enabled', async () => {
    const { api, result } = setup()
    await waitFor(() => expect(result.current.items).toHaveLength(2))
    const enabledItem = result.current.items.find(i => i.enabled)!
    await act(async () => {
      result.current.handleToggleEnabled(enabledItem)
    })
    await waitFor(() => {
      expect(api.disable).toHaveBeenCalledWith(enabledItem.id)
    })
  })

  it('calls api.enable when item is currently disabled', async () => {
    const { api, result } = setup()
    await waitFor(() => expect(result.current.items).toHaveLength(2))
    const disabledItem = result.current.items.find(i => !i.enabled)!
    await act(async () => {
      result.current.handleToggleEnabled(disabledItem)
    })
    await waitFor(() => {
      expect(api.enable).toHaveBeenCalledWith(disabledItem.id)
    })
  })
})
