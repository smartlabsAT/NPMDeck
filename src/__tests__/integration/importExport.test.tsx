import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen, waitFor, userEvent } from '../../test/utils'
import ImportDialog from '../../components/ImportDialog'
import ExportDialog from '../../components/ExportDialog'
import { mockProxyHost } from '../../test/fixtures'

// --- API mocks -----------------------------------------------------------
vi.mock('../../api/proxyHosts', () => ({
  proxyHostsApi: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
  },
}))

vi.mock('../../api/redirectionHosts', () => ({
  redirectionHostsApi: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
  },
}))

vi.mock('../../api/deadHosts', () => ({
  deadHostsApi: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
  },
}))

vi.mock('../../api/streams', () => ({
  streamsApi: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
  },
}))

vi.mock('../../api/accessLists', () => ({
  accessListsApi: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
  },
}))

vi.mock('../../api/certificates', () => ({
  certificatesApi: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
  },
}))

// -------------------------------------------------------------------------

describe('Export dialog integration', () => {
  const sampleHost = mockProxyHost({ id: 1, domain_names: ['export.test'] })

  it('renders the export dialog when open', () => {
    renderWithProviders(
      <ExportDialog
        open
        onClose={vi.fn()}
        items={[sampleHost]}
        type="proxy_host"
        itemName="Proxy Host"
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not render dialog content when closed', () => {
    renderWithProviders(
      <ExportDialog
        open={false}
        onClose={vi.fn()}
        items={[sampleHost]}
        type="proxy_host"
        itemName="Proxy Host"
      />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('triggers URL.createObjectURL when export is confirmed', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    const originalCreate = URL.createObjectURL
    URL.createObjectURL = createObjectURL

    try {
      renderWithProviders(
        <ExportDialog
          open
          onClose={vi.fn()}
          items={[sampleHost]}
          type="proxy_host"
          itemName="Proxy Host"
        />,
      )

      // ExportDialog renders an "Export" button in DialogActions
      const exportBtn = await screen.findByRole('button', { name: /^export$/i })
      await userEvent.click(exportBtn)

      await waitFor(() => {
        expect(createObjectURL).toHaveBeenCalled()
      })
    } finally {
      URL.createObjectURL = originalCreate
    }
  })
})

describe('Import dialog integration', () => {
  it('renders the import dialog when open', () => {
    renderWithProviders(
      <ImportDialog
        open
        onClose={vi.fn()}
        onImportComplete={vi.fn()}
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not render dialog content when closed', () => {
    renderWithProviders(
      <ImportDialog
        open={false}
        onClose={vi.fn()}
        onImportComplete={vi.fn()}
      />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the dropzone area', () => {
    renderWithProviders(
      <ImportDialog open onClose={vi.fn()} onImportComplete={vi.fn()} />,
    )
    // ImportDialog step 0 shows a drag-and-drop Paper with this prompt text
    expect(screen.getByText(/drag & drop a json file here/i)).toBeInTheDocument()
  })
})
