import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDataTable } from '../useDataTable'
import type { TableColumn } from '../../components/DataTable/types'

interface TestItem {
  id: number
  name: string
  value: number
  enabled: boolean
}

const columns: TableColumn<TestItem>[] = [
  { id: 'id', label: 'ID', accessor: (item) => item.id, sortable: true },
  { id: 'name', label: 'Name', accessor: (item) => item.name, sortable: true },
  { id: 'value', label: 'Value', accessor: (item) => item.value, sortable: true },
]

const keyExtractor = (item: TestItem) => item.id

const testData: TestItem[] = [
  { id: 1, name: 'alpha', value: 10, enabled: true },
  { id: 2, name: 'beta', value: 5, enabled: false },
  { id: 3, name: 'gamma', value: 20, enabled: true },
]

describe('useDataTable — initial state', () => {
  it('returns data unsorted when no defaultSortField', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    expect(result.current.processedData).toEqual(testData)
  })

  it('starts at page 0 with default rowsPerPage=10', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    expect(result.current.page).toBe(0)
    expect(result.current.rowsPerPage).toBe(10)
  })

  it('respects defaultSortField ascending', () => {
    const { result } = renderHook(() =>
      useDataTable(testData, columns, keyExtractor, {
        defaultSortField: 'value',
        defaultSortDirection: 'asc',
      }),
    )
    expect(result.current.processedData[0].value).toBe(5)
    expect(result.current.processedData[2].value).toBe(20)
  })

  it('respects defaultSortDirection desc', () => {
    const { result } = renderHook(() =>
      useDataTable(testData, columns, keyExtractor, {
        defaultSortField: 'value',
        defaultSortDirection: 'desc',
      }),
    )
    expect(result.current.processedData[0].value).toBe(20)
  })

  it('initialises totalCount to full data length', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    expect(result.current.totalCount).toBe(testData.length)
  })

  it('initialises selected as empty array', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    expect(result.current.selected).toHaveLength(0)
    expect(result.current.selectedCount).toBe(0)
  })

  it('initialises searchQuery as empty string', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    expect(result.current.searchQuery).toBe('')
  })

  it('initialises filters as empty object when no defaultFilters provided', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    expect(result.current.filters).toEqual({})
  })

  it('respects defaultFilters option', () => {
    const defaultFilters = { name: 'alpha' }
    const { result } = renderHook(() =>
      useDataTable(testData, columns, keyExtractor, { defaultFilters }),
    )
    expect(result.current.filters).toEqual(defaultFilters)
  })
})

describe('useDataTable — sorting', () => {
  it('sorts ascending when handleSort is called with a new field', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    act(() => result.current.handleSort('value'))
    expect(result.current.processedData[0].value).toBe(5)
  })

  it('toggles to descending on second call to same field', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    act(() => result.current.handleSort('value'))
    act(() => result.current.handleSort('value'))
    expect(result.current.processedData[0].value).toBe(20)
  })

  it('resets to page 0 when sorting', () => {
    const { result } = renderHook(() =>
      useDataTable(testData, columns, keyExtractor, { defaultRowsPerPage: 1 }),
    )
    act(() => result.current.handleChangePage(null, 2))
    expect(result.current.page).toBe(2)
    act(() => result.current.handleSort('name'))
    expect(result.current.page).toBe(0)
  })

  it('sorts by name alphabetically ascending', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    act(() => result.current.handleSort('name'))
    expect(result.current.processedData[0].name).toBe('alpha')
    expect(result.current.processedData[1].name).toBe('beta')
    expect(result.current.processedData[2].name).toBe('gamma')
  })

  it('sorts by name alphabetically descending after toggle', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    act(() => result.current.handleSort('name'))
    act(() => result.current.handleSort('name'))
    expect(result.current.processedData[0].name).toBe('gamma')
    expect(result.current.processedData[2].name).toBe('alpha')
  })

  it('updates sortField and sortDirection state correctly', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    act(() => result.current.handleSort('value'))
    expect(result.current.sortField).toBe('value')
    expect(result.current.sortDirection).toBe('asc')
    act(() => result.current.handleSort('value'))
    expect(result.current.sortDirection).toBe('desc')
  })
})

describe('useDataTable — search', () => {
  it('filters data by search query (case-insensitive)', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    act(() => result.current.handleSearch('ALPHA'))
    expect(result.current.processedData).toHaveLength(1)
    expect(result.current.processedData[0].name).toBe('alpha')
  })

  it('returns empty when no match', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    act(() => result.current.handleSearch('nonexistent'))
    expect(result.current.processedData).toHaveLength(0)
  })

  it('clears search on handleClearFilters', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    act(() => result.current.handleSearch('alpha'))
    expect(result.current.processedData).toHaveLength(1)
    act(() => result.current.handleClearFilters())
    expect(result.current.searchQuery).toBe('')
    expect(result.current.processedData).toHaveLength(3)
  })

  it('resets page to 0 on search', () => {
    const { result } = renderHook(() =>
      useDataTable(testData, columns, keyExtractor, { defaultRowsPerPage: 1 }),
    )
    act(() => result.current.handleChangePage(null, 1))
    expect(result.current.page).toBe(1)
    act(() => result.current.handleSearch('alpha'))
    expect(result.current.page).toBe(0)
  })

  it('updates totalCount after search', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    act(() => result.current.handleSearch('beta'))
    expect(result.current.totalCount).toBe(1)
  })

  it('updates searchQuery state correctly', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    act(() => result.current.handleSearch('gamma'))
    expect(result.current.searchQuery).toBe('gamma')
  })
})

describe('useDataTable — pagination', () => {
  it('paginates correctly with rowsPerPage=2', () => {
    const { result } = renderHook(() =>
      useDataTable(testData, columns, keyExtractor, { defaultRowsPerPage: 2 }),
    )
    expect(result.current.paginatedData).toHaveLength(2)
  })

  it('moves to next page', () => {
    const { result } = renderHook(() =>
      useDataTable(testData, columns, keyExtractor, { defaultRowsPerPage: 2 }),
    )
    act(() => result.current.handleChangePage(null, 1))
    expect(result.current.paginatedData).toHaveLength(1)
    expect(result.current.paginatedData[0].id).toBe(3)
  })

  it('updates rowsPerPage and resets to page 0', () => {
    const { result } = renderHook(() =>
      useDataTable(testData, columns, keyExtractor, { defaultRowsPerPage: 1 }),
    )
    act(() => result.current.handleChangePage(null, 2))
    act(() =>
      result.current.handleChangeRowsPerPage({
        target: { value: '10' },
      } as React.ChangeEvent<HTMLInputElement>),
    )
    expect(result.current.rowsPerPage).toBe(10)
    expect(result.current.page).toBe(0)
  })
})

describe('useDataTable — selection', () => {
  it('handleSelect adds item to selection', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    act(() => result.current.handleSelect(testData[0]))
    expect(result.current.selected).toHaveLength(1)
    expect(result.current.selected[0].id).toBe(1)
  })

  it('handleSelect toggles item off when already selected', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    act(() => result.current.handleSelect(testData[0]))
    act(() => result.current.handleSelect(testData[0]))
    expect(result.current.selected).toHaveLength(0)
  })

  it('handleSelectAll selects all items on current page', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    act(() => result.current.handleSelectAll())
    expect(result.current.selected).toHaveLength(3)
    expect(result.current.isAllSelected).toBe(true)
  })

  it('handleSelectAll deselects all when already all selected', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    act(() => result.current.handleSelectAll())
    act(() => result.current.handleSelectAll())
    expect(result.current.selected).toHaveLength(0)
    expect(result.current.isAllSelected).toBe(false)
  })

  it('isIndeterminate is true when some but not all selected', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    act(() => result.current.handleSelect(testData[0]))
    expect(result.current.isIndeterminate).toBe(true)
  })

  it('handleClearSelection empties selection', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    act(() => result.current.handleSelectAll())
    act(() => result.current.handleClearSelection())
    expect(result.current.selected).toHaveLength(0)
  })

  it('selectedCount reflects number of selected items', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    act(() => result.current.handleSelect(testData[0]))
    act(() => result.current.handleSelect(testData[1]))
    expect(result.current.selectedCount).toBe(2)
  })

  it('isIndeterminate is false when none selected', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    expect(result.current.isIndeterminate).toBe(false)
  })
})

describe('useDataTable — filters', () => {
  it('applies custom filter function', () => {
    const filterFunction = (item: TestItem, filters: Record<string, unknown>) =>
      filters.enabled === undefined || filters.enabled === 'all' || item.enabled === (filters.enabled === 'true')
    const { result } = renderHook(() =>
      useDataTable(testData, columns, keyExtractor, { filterFunction }),
    )
    act(() => result.current.handleFilter('enabled', 'true'))
    expect(result.current.processedData).toHaveLength(2)
  })

  it('resets page to 0 on filter change', () => {
    const { result } = renderHook(() =>
      useDataTable(testData, columns, keyExtractor, { defaultRowsPerPage: 1 }),
    )
    act(() => result.current.handleChangePage(null, 2))
    act(() => result.current.handleFilter('name', 'alpha'))
    expect(result.current.page).toBe(0)
  })

  it('stores filter value in filters state', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    act(() => result.current.handleFilter('name', 'alpha'))
    expect(result.current.filters).toMatchObject({ name: 'alpha' })
  })

  it('handleClearFilters resets filters to empty object', () => {
    const { result } = renderHook(() => useDataTable(testData, columns, keyExtractor))
    act(() => result.current.handleFilter('name', 'alpha'))
    act(() => result.current.handleClearFilters())
    expect(result.current.filters).toEqual({})
  })

  it('built-in is_disabled filter works', () => {
    interface DisableItem { id: number; name: string; value: number; enabled: boolean; is_disabled: boolean }
    const disableColumns: TableColumn<DisableItem>[] = [
      { id: 'id', label: 'ID', accessor: (item) => item.id, sortable: true },
      { id: 'name', label: 'Name', accessor: (item) => item.name, sortable: true },
      { id: 'value', label: 'Value', accessor: (item) => item.value, sortable: true },
    ]
    const disableData: DisableItem[] = [
      { id: 1, name: 'alpha', value: 10, enabled: true, is_disabled: false },
      { id: 2, name: 'beta', value: 5, enabled: false, is_disabled: true },
      { id: 3, name: 'gamma', value: 20, enabled: true, is_disabled: false },
    ]
    const { result } = renderHook(() =>
      useDataTable(disableData, disableColumns, (item) => item.id),
    )
    act(() => result.current.handleFilter('is_disabled', 'true'))
    expect(result.current.processedData).toHaveLength(1)
    expect(result.current.processedData[0].id).toBe(2)
  })
})

describe('useDataTable — reset', () => {
  it('resetTable restores initial state', () => {
    const { result } = renderHook(() =>
      useDataTable(testData, columns, keyExtractor, { defaultRowsPerPage: 10 }),
    )
    act(() => result.current.handleSort('value'))
    act(() => result.current.handleSearch('alpha'))
    act(() => result.current.handleSelectAll())
    act(() => result.current.resetTable())
    expect(result.current.searchQuery).toBe('')
    expect(result.current.sortField).toBeUndefined()
    expect(result.current.selected).toHaveLength(0)
  })

  it('resetTable restores page and rowsPerPage to defaults', () => {
    const { result } = renderHook(() =>
      useDataTable(testData, columns, keyExtractor, { defaultRowsPerPage: 5 }),
    )
    act(() => result.current.handleChangePage(null, 1))
    act(() =>
      result.current.handleChangeRowsPerPage({
        target: { value: '25' },
      } as React.ChangeEvent<HTMLInputElement>),
    )
    act(() => result.current.resetTable())
    expect(result.current.page).toBe(0)
    expect(result.current.rowsPerPage).toBe(5)
  })

  it('resetTable restores sortField to defaultSortField when one was configured', () => {
    const { result } = renderHook(() =>
      useDataTable(testData, columns, keyExtractor, {
        defaultSortField: 'name',
        defaultSortDirection: 'asc',
      }),
    )
    act(() => result.current.handleSort('value'))
    expect(result.current.sortField).toBe('value')
    act(() => result.current.resetTable())
    expect(result.current.sortField).toBe('name')
  })
})

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

interface GroupItem {
  id: number
  name: string
  category: string
}

const groupColumns: TableColumn<GroupItem>[] = [
  { id: 'id', label: 'ID', accessor: (item) => item.id, sortable: true },
  { id: 'name', label: 'Name', accessor: (item) => item.name, sortable: true },
]

const groupKeyExtractor = (item: GroupItem) => item.id

const groupData: GroupItem[] = [
  { id: 1, name: 'alpha', category: 'A' },
  { id: 2, name: 'beta', category: 'B' },
  { id: 3, name: 'gamma', category: 'A' },
]

const groupConfig = {
  groupBy: (item: GroupItem) => item.category,
  groupLabel: (groupId: string) => `Category ${groupId}`,
  defaultEnabled: true,
  defaultExpanded: true,
}

describe('useDataTable — grouping', () => {
  it('initialises groupingEnabled from groupConfig.defaultEnabled', () => {
    const { result } = renderHook(() =>
      useDataTable(groupData, groupColumns, groupKeyExtractor, undefined, groupConfig),
    )
    expect(result.current.groupingEnabled).toBe(true)
  })

  it('returns empty groups array when grouping is disabled', () => {
    const disabledConfig = { ...groupConfig, defaultEnabled: false }
    const { result } = renderHook(() =>
      useDataTable(groupData, groupColumns, groupKeyExtractor, undefined, disabledConfig),
    )
    expect(result.current.groupingEnabled).toBe(false)
    expect(result.current.groups).toHaveLength(0)
  })

  it('populates groups with correct ids and items when grouping is enabled', () => {
    const { result } = renderHook(() =>
      useDataTable(groupData, groupColumns, groupKeyExtractor, undefined, groupConfig),
    )
    expect(result.current.groups).toHaveLength(2)
    const groupA = result.current.groups.find((g) => g.id === 'A')
    const groupB = result.current.groups.find((g) => g.id === 'B')
    expect(groupA?.items).toHaveLength(2)
    expect(groupB?.items).toHaveLength(1)
  })

  it('handleToggleGrouping flips groupingEnabled and resets page to 0', () => {
    const { result } = renderHook(() =>
      useDataTable(
        groupData,
        groupColumns,
        groupKeyExtractor,
        { defaultRowsPerPage: 1 },
        groupConfig,
      ),
    )
    act(() => result.current.handleChangePage(null, 1))
    expect(result.current.page).toBe(1)
    act(() => result.current.handleToggleGrouping())
    expect(result.current.groupingEnabled).toBe(false)
    expect(result.current.page).toBe(0)
  })

  it('handleToggleGroup collapses an expanded group (defaultExpanded true)', () => {
    // With defaultExpanded: true, groups start expanded.
    // handleToggleGroup adds the id to expandedGroups which marks it collapsed.
    const { result } = renderHook(() =>
      useDataTable(groupData, groupColumns, groupKeyExtractor, undefined, groupConfig),
    )
    // Initially group A should be expanded
    const groupABefore = result.current.groups.find((g) => g.id === 'A')
    expect(groupABefore?.isExpanded).toBe(true)

    act(() => result.current.handleToggleGroup('A'))

    const groupAAfter = result.current.groups.find((g) => g.id === 'A')
    expect(groupAAfter?.isExpanded).toBe(false)
  })

  it('handleToggleAllGroups(false) collapses all groups', () => {
    const { result } = renderHook(() =>
      useDataTable(groupData, groupColumns, groupKeyExtractor, undefined, groupConfig),
    )
    // All groups start expanded; collapse all
    act(() => result.current.handleToggleAllGroups(false))
    expect(result.current.groups.every((g) => !g.isExpanded)).toBe(true)
  })

  it('paginatedData flattens only expanded groups', () => {
    const { result } = renderHook(() =>
      useDataTable(groupData, groupColumns, groupKeyExtractor, undefined, groupConfig),
    )
    // Collapse group A (2 items), keep group B (1 item) expanded
    act(() => result.current.handleToggleGroup('A'))
    // Only group B's items should be in paginatedData
    expect(result.current.paginatedData).toHaveLength(1)
    expect(result.current.paginatedData[0].category).toBe('B')
  })
})

// ---------------------------------------------------------------------------
// Built-in filter: roles
// ---------------------------------------------------------------------------

interface UserLike {
  id: number
  roles: string[]
}

const userColumns: TableColumn<UserLike>[] = [
  { id: 'id', label: 'ID', accessor: (u) => u.id, sortable: true },
]

const userData: UserLike[] = [
  { id: 1, roles: ['admin'] },
  { id: 2, roles: ['user'] },
  { id: 3, roles: ['admin', 'user'] },
]

describe('useDataTable — built-in filter: roles', () => {
  it('filter value "admin" returns only admin users', () => {
    const { result } = renderHook(() => useDataTable(userData, userColumns, (u) => u.id))
    act(() => result.current.handleFilter('roles', 'admin'))
    expect(result.current.processedData.length).toBeGreaterThan(0)
    expect(result.current.processedData.every((u) => u.roles.includes('admin'))).toBe(true)
  })

  it('filter value "user" excludes admins', () => {
    const { result } = renderHook(() => useDataTable(userData, userColumns, (u) => u.id))
    act(() => result.current.handleFilter('roles', 'user'))
    expect(result.current.processedData.length).toBeGreaterThan(0)
    expect(result.current.processedData.every((u) => !u.roles.includes('admin'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Built-in filter: hasUsers
// ---------------------------------------------------------------------------

interface AccessListLike {
  id: number
  items?: { username: string }[]
}

const accessListColumns: TableColumn<AccessListLike>[] = [
  { id: 'id', label: 'ID', accessor: (a) => a.id, sortable: true },
]

// Note: the hasUsers filter only applies to items that have the 'items' field.
// Entries without the field are not matched by the filter guard and pass through.
const accessListData: AccessListLike[] = [
  { id: 1, items: [{ username: 'alice' }] },
  { id: 2, items: [] },
  { id: 3, items: [] },
]

describe('useDataTable — built-in filter: hasUsers', () => {
  it('filter value "with-users" returns only entries that have users', () => {
    const { result } = renderHook(() =>
      useDataTable(accessListData, accessListColumns, (a) => a.id),
    )
    act(() => result.current.handleFilter('hasUsers', 'with-users'))
    expect(result.current.processedData).toHaveLength(1)
    expect(result.current.processedData[0].id).toBe(1)
  })

  it('filter value "no-users" returns only entries without users', () => {
    const { result } = renderHook(() =>
      useDataTable(accessListData, accessListColumns, (a) => a.id),
    )
    act(() => result.current.handleFilter('hasUsers', 'no-users'))
    // id 2 and id 3 both have empty items arrays
    expect(result.current.processedData).toHaveLength(2)
    expect(result.current.processedData.map((a) => a.id).sort()).toEqual([2, 3])
  })
})

// ---------------------------------------------------------------------------
// Built-in filter: provider
// ---------------------------------------------------------------------------

interface CertLike {
  id: number
  provider: string
}

const certColumns: TableColumn<CertLike>[] = [
  { id: 'id', label: 'ID', accessor: (c) => c.id, sortable: true },
]

const certData: CertLike[] = [
  { id: 1, provider: 'letsencrypt' },
  { id: 2, provider: 'custom' },
  { id: 3, provider: 'other-ca' },
]

describe('useDataTable — built-in filter: provider', () => {
  it('filter value "letsencrypt" returns only letsencrypt certs', () => {
    const { result } = renderHook(() => useDataTable(certData, certColumns, (c) => c.id))
    act(() => result.current.handleFilter('provider', 'letsencrypt'))
    expect(result.current.processedData).toHaveLength(1)
    expect(result.current.processedData[0].provider).toBe('letsencrypt')
  })

  it('filter value "other" returns only non-letsencrypt certs', () => {
    const { result } = renderHook(() => useDataTable(certData, certColumns, (c) => c.id))
    act(() => result.current.handleFilter('provider', 'other'))
    expect(result.current.processedData).toHaveLength(2)
    expect(result.current.processedData.every((c) => c.provider !== 'letsencrypt')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// handleSelectAll — cross-page behaviour
// ---------------------------------------------------------------------------

describe('useDataTable — handleSelectAll cross-page', () => {
  it('handleSelectAll only selects items on current page', () => {
    const { result } = renderHook(() =>
      useDataTable(testData, columns, keyExtractor, { defaultRowsPerPage: 2 }),
    )
    act(() => result.current.handleSelectAll())
    expect(result.current.selected.map((i) => i.id).sort()).toEqual([1, 2])
  })
})
