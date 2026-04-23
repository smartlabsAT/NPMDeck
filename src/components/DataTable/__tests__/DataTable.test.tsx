import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen, userEvent, waitFor } from '../../../test/utils'
import { DataTable } from '..'
import type { TableColumn } from '../types'

interface Row {
  id: number
  name: string
  value: number
}

const columns: TableColumn<Row>[] = [
  { id: 'name', label: 'Name', accessor: (r) => r.name, sortable: true },
  { id: 'value', label: 'Value', accessor: (r) => r.value, sortable: true },
]

const data: Row[] = [
  { id: 1, name: 'alpha', value: 10 },
  { id: 2, name: 'beta', value: 20 },
]

const keyExtractor = (r: Row) => r.id

describe('DataTable', () => {
  it('renders column headers', () => {
    renderWithProviders(
      <DataTable data={data} columns={columns} keyExtractor={keyExtractor} />,
    )
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Value')).toBeInTheDocument()
  })

  it('renders row data', () => {
    renderWithProviders(
      <DataTable data={data} columns={columns} keyExtractor={keyExtractor} />,
    )
    expect(screen.getByText('alpha')).toBeInTheDocument()
    // Use getAllByText because TablePagination also renders "10" as rows-per-page
    const tens = screen.getAllByText('10')
    expect(tens.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('beta')).toBeInTheDocument()
  })

  it('renders empty message when data is empty', () => {
    renderWithProviders(
      <DataTable
        data={[]}
        columns={columns}
        keyExtractor={keyExtractor}
        emptyMessage="No items found"
      />,
    )
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('shows loading indicator when loading=true', () => {
    renderWithProviders(
      <DataTable data={[]} columns={columns} keyExtractor={keyExtractor} loading />,
    )
    // DataTable returns early with a centered CircularProgress when loading
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('shows error message when error is set', () => {
    renderWithProviders(
      <DataTable
        data={[]}
        columns={columns}
        keyExtractor={keyExtractor}
        error="Load failed"
      />,
    )
    expect(screen.getByText(/load failed/i)).toBeInTheDocument()
  })

  it('filters rows via search input', async () => {
    // searchable defaults to true so search field is always rendered
    renderWithProviders(
      <DataTable
        data={data}
        columns={columns}
        keyExtractor={keyExtractor}
        searchPlaceholder="Search items"
      />,
    )
    const input = screen.getByPlaceholderText('Search items')
    await userEvent.type(input, 'alpha')
    await waitFor(() => {
      expect(screen.getByText('alpha')).toBeInTheDocument()
      expect(screen.queryByText('beta')).not.toBeInTheDocument()
    })
  })

  it('respects defaultSortField and defaultSortDirection', () => {
    renderWithProviders(
      <DataTable
        data={data}
        columns={columns}
        keyExtractor={keyExtractor}
        defaultSortField="value"
        defaultSortDirection="desc"
      />,
    )
    // With desc sort on value, beta (20) should come before alpha (10)
    const rows = screen.getAllByRole('row')
    // rows[0] is the header row, rows[1] is the first data row
    expect(rows[1]).toHaveTextContent('beta')
    expect(rows[2]).toHaveTextContent('alpha')
  })

  it('sorts rows when a sortable column header is clicked', async () => {
    renderWithProviders(
      <DataTable data={data} columns={columns} keyExtractor={keyExtractor} />,
    )
    // Click the Value header to sort ascending
    await userEvent.click(screen.getByRole('button', { name: /value/i }))
    const rows = screen.getAllByRole('row')
    // Ascending: alpha (10) before beta (20)
    expect(rows[1]).toHaveTextContent('alpha')
    expect(rows[2]).toHaveTextContent('beta')
  })
})
