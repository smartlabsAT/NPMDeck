import { describe, it, expect, vi } from 'vitest'
import { createStandardBulkActions } from '../bulkActionFactory'

interface TestItem {
  id: number
  created_on: string
  modified_on: string
  enabled: boolean
}

function mockItem(overrides: Partial<TestItem> = {}): TestItem {
  return {
    id: 1,
    created_on: '2026-01-01T00:00:00.000Z',
    modified_on: '2026-01-01T00:00:00.000Z',
    enabled: true,
    ...overrides,
  }
}

function setup(actionsOverride?: ('enable' | 'disable' | 'delete')[]) {
  const api = {
    enable: vi.fn().mockResolvedValue(undefined),
    disable: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  }
  const showSuccess = vi.fn()
  const showError = vi.fn()
  const showWarning = vi.fn()
  const loadItems = vi.fn().mockResolvedValue(undefined)

  const actions = createStandardBulkActions<TestItem>({
    api,
    entityType: 'proxy-host',
    entityLabel: 'proxy hosts',
    showSuccess,
    showError,
    showWarning,
    loadItems,
    actions: actionsOverride,
  })
  return { api, showSuccess, showError, showWarning, loadItems, actions }
}

describe('createStandardBulkActions', () => {
  it('returns three actions by default: enable, disable, delete', () => {
    const { actions } = setup()
    expect(actions.map(a => a.id).sort()).toEqual(['delete', 'disable', 'enable'])
  })

  it('respects actions filter', () => {
    const { actions } = setup(['delete'])
    expect(actions).toHaveLength(1)
    expect(actions[0].id).toBe('delete')
  })

  it('enable action calls api.enable for disabled items only', async () => {
    const { api, actions } = setup()
    const enable = actions.find(a => a.id === 'enable')!
    await enable.action([mockItem({ id: 1, enabled: false }), mockItem({ id: 2, enabled: true })])
    expect(api.enable).toHaveBeenCalledWith(1)
    expect(api.enable).toHaveBeenCalledTimes(1)
  })

  it('enable action calls showSuccess when all succeed', async () => {
    const { showSuccess, actions } = setup()
    const enable = actions.find(a => a.id === 'enable')!
    await enable.action([mockItem({ id: 1, enabled: false })])
    expect(showSuccess).toHaveBeenCalled()
  })

  it('enable action calls showError when all fail', async () => {
    const api = {
      enable: vi.fn().mockRejectedValue(new Error('fail')),
      disable: vi.fn(),
      delete: vi.fn(),
    }
    const showError = vi.fn()
    const actions = createStandardBulkActions<TestItem>({
      api,
      entityType: 'proxy-host',
      entityLabel: 'proxy hosts',
      showSuccess: vi.fn(),
      showError,
      showWarning: vi.fn(),
      loadItems: vi.fn(),
    })
    const enable = actions.find(a => a.id === 'enable')!
    await enable.action([mockItem({ id: 1, enabled: false })])
    expect(showError).toHaveBeenCalled()
  })

  it('enable action calls showWarning when some fail', async () => {
    const api = {
      enable: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('fail')),
      disable: vi.fn(),
      delete: vi.fn(),
    }
    const showWarning = vi.fn()
    const actions = createStandardBulkActions<TestItem>({
      api,
      entityType: 'proxy-host',
      entityLabel: 'proxy hosts',
      showSuccess: vi.fn(),
      showError: vi.fn(),
      showWarning,
      loadItems: vi.fn(),
    })
    const enable = actions.find(a => a.id === 'enable')!
    await enable.action([mockItem({ id: 1, enabled: false }), mockItem({ id: 2, enabled: false })])
    expect(showWarning).toHaveBeenCalled()
  })

  it('enable action calls loadItems after completion', async () => {
    const { loadItems, actions } = setup()
    const enable = actions.find(a => a.id === 'enable')!
    await enable.action([mockItem({ id: 1, enabled: false })])
    expect(loadItems).toHaveBeenCalled()
  })

  it('disable action calls api.disable for enabled items only', async () => {
    const { api, actions } = setup()
    const disable = actions.find(a => a.id === 'disable')!
    await disable.action([mockItem({ id: 1, enabled: true }), mockItem({ id: 2, enabled: false })])
    expect(api.disable).toHaveBeenCalledWith(1)
    expect(api.disable).toHaveBeenCalledTimes(1)
  })

  it('delete action calls api.delete for all items', async () => {
    const { api, actions } = setup()
    const del = actions.find(a => a.id === 'delete')!
    await del.action([mockItem({ id: 1 }), mockItem({ id: 2 })])
    expect(api.delete).toHaveBeenCalledWith(1)
    expect(api.delete).toHaveBeenCalledWith(2)
    expect(api.delete).toHaveBeenCalledTimes(2)
  })

  it('every action has icon, label, and confirmMessage', () => {
    const { actions } = setup()
    for (const action of actions) {
      // Icon must be defined (React element)
      expect(action.icon).toBeDefined()
      // Label must be a non-empty string
      expect(typeof action.label).toBe('string')
      expect((action.label as string).length).toBeGreaterThan(0)
      // Confirm message must be a non-empty string
      expect(typeof action.confirmMessage).toBe('string')
      expect((action.confirmMessage as string).length).toBeGreaterThan(0)
    }
  })
})
