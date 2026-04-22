import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderSslStatus, renderDomainLinks } from '../columnRenderers'

describe('renderSslStatus', () => {
  it('renders LockOpen icon for items without certificate', () => {
    const { container } = render(<>{renderSslStatus({ certificate_id: null, ssl_forced: false })}</>)
    expect(container.querySelector('svg[data-testid="LockOpenIcon"]')).toBeInTheDocument()
  })

  it('renders Lock icon for items with certificate', () => {
    const { container } = render(<>{renderSslStatus({ certificate_id: 1, ssl_forced: true })}</>)
    expect(container.querySelector('svg[data-testid="LockIcon"]')).toBeInTheDocument()
  })

  it('uses primary color when ssl_forced', () => {
    const { container } = render(<>{renderSslStatus({ certificate_id: 1, ssl_forced: true })}</>)
    const icon = container.querySelector('svg[data-testid="LockIcon"]')
    expect(icon?.getAttribute('class')).toContain('colorPrimary')
  })

  it('uses action color when SSL not forced', () => {
    const { container } = render(<>{renderSslStatus({ certificate_id: 1, ssl_forced: false })}</>)
    const icon = container.querySelector('svg[data-testid="LockIcon"]')
    expect(icon?.getAttribute('class')).toContain('colorAction')
  })
})

describe('renderDomainLinks', () => {
  it('renders each domain as text', () => {
    render(<>{renderDomainLinks(['example.com', 'api.example.com'])}</>)
    expect(screen.getByText('example.com')).toBeInTheDocument()
    expect(screen.getByText('api.example.com')).toBeInTheDocument()
  })

  it('renders external link buttons for each domain', () => {
    render(<>{renderDomainLinks(['a.com', 'b.com'])}</>)
    const buttons = screen.getAllByLabelText('Open domain in new tab')
    expect(buttons).toHaveLength(2)
  })
})
