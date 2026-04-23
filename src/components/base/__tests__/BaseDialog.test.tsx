import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen, userEvent } from '../../../test/utils'
import BaseDialog from '../BaseDialog'

describe('BaseDialog', () => {
  it('renders when open=true', () => {
    renderWithProviders(
      <BaseDialog open title="Test Dialog" onClose={vi.fn()}>
        <div>Dialog content</div>
      </BaseDialog>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Dialog content')).toBeInTheDocument()
  })

  it('does not render when open=false', () => {
    renderWithProviders(
      <BaseDialog open={false} title="Test" onClose={vi.fn()}>
        <div>Dialog content</div>
      </BaseDialog>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    renderWithProviders(
      <BaseDialog open title="Test" onClose={onClose}>
        <div>content</div>
      </BaseDialog>,
    )
    // DialogSeverityHeader uses aria-label="close" on the IconButton
    const closeButton = screen.getByRole('button', { name: /close/i })
    await userEvent.click(closeButton)
    expect(onClose).toHaveBeenCalled()
  })

  it('renders title correctly', () => {
    renderWithProviders(
      <BaseDialog open title="My Unique Title" onClose={vi.fn()}>
        <div>content</div>
      </BaseDialog>,
    )
    expect(screen.getByText('My Unique Title')).toBeInTheDocument()
  })

  it('renders severity header with matching icon when severity=warning', () => {
    renderWithProviders(
      <BaseDialog open title="Warning!" severity="warning" onClose={vi.fn()}>
        <div>content</div>
      </BaseDialog>,
    )
    expect(screen.getByTestId('WarningIcon')).toBeInTheDocument()
  })

  it('renders ErrorIcon when severity=error', () => {
    renderWithProviders(
      <BaseDialog open title="Error!" severity="error" onClose={vi.fn()}>
        <div>content</div>
      </BaseDialog>,
    )
    expect(screen.getByTestId('ErrorIcon')).toBeInTheDocument()
  })
})
