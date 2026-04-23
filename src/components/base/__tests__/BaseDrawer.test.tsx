import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen, userEvent, waitFor } from '../../../test/utils'
import BaseDrawer from '../BaseDrawer'

describe('BaseDrawer', () => {
  it('renders children when open=true', () => {
    renderWithProviders(
      <BaseDrawer open title="Test Drawer" onClose={vi.fn()}>
        <div>drawer-content</div>
      </BaseDrawer>,
    )
    expect(screen.getByText('drawer-content')).toBeInTheDocument()
  })

  it('renders title', () => {
    renderWithProviders(
      <BaseDrawer open title="My Drawer Title" onClose={vi.fn()}>
        <div>content</div>
      </BaseDrawer>,
    )
    expect(screen.getByText('My Drawer Title')).toBeInTheDocument()
  })

  it('calls onClose on close button click when not dirty', async () => {
    const onClose = vi.fn()
    renderWithProviders(
      <BaseDrawer open title="Test" onClose={onClose}>
        <div>content</div>
      </BaseDrawer>,
    )
    // DrawerHeader uses aria-label="Close drawer" on its IconButton
    const closeBtn = screen.getByRole('button', { name: /close drawer/i })
    await userEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })

  it('shows confirm dialog when dirty and close is clicked', async () => {
    const onClose = vi.fn()
    renderWithProviders(
      <BaseDrawer open title="Test" onClose={onClose} isDirty confirmClose>
        <div>content</div>
      </BaseDrawer>,
    )
    const closeBtn = screen.getByRole('button', { name: /close drawer/i })
    await userEvent.click(closeBtn)
    await waitFor(() => {
      // DrawerCloseConfirmDialog renders "Unsaved Changes" as its title
      expect(screen.getByText('Unsaved Changes')).toBeInTheDocument()
    })
    // onClose should NOT have been called directly
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose after confirming in the unsaved-changes dialog', async () => {
    const onClose = vi.fn()
    renderWithProviders(
      <BaseDrawer open title="Test" onClose={onClose} isDirty confirmClose>
        <div>content</div>
      </BaseDrawer>,
    )
    const closeBtn = screen.getByRole('button', { name: /close drawer/i })
    await userEvent.click(closeBtn)
    await waitFor(() => expect(screen.getByText('Unsaved Changes')).toBeInTheDocument())
    const confirmBtn = screen.getByRole('button', { name: /close without saving/i })
    await userEvent.click(confirmBtn)
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })
})
