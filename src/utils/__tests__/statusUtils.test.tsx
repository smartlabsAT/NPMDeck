import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { getStatusIcon, getStatusText, getStatusColor } from '../statusUtils'

describe('getStatusText', () => {
  it('returns "Disabled" when item is disabled', () => {
    expect(getStatusText({ enabled: false, meta: { nginx_online: true, nginx_err: null } })).toBe('Disabled')
  })

  it('returns "Offline" when enabled but nginx offline', () => {
    expect(getStatusText({ enabled: true, meta: { nginx_online: false, nginx_err: 'err' } })).toBe('Offline')
  })

  it('returns "Online" when enabled and nginx online', () => {
    expect(getStatusText({ enabled: true, meta: { nginx_online: true, nginx_err: null } })).toBe('Online')
  })
})

describe('getStatusColor', () => {
  it('returns "default" for disabled', () => {
    expect(getStatusColor({ enabled: false, meta: { nginx_online: true, nginx_err: null } })).toBe('default')
  })

  it('returns "error" for offline', () => {
    expect(getStatusColor({ enabled: true, meta: { nginx_online: false, nginx_err: 'e' } })).toBe('error')
  })

  it('returns "success" for online', () => {
    expect(getStatusColor({ enabled: true, meta: { nginx_online: true, nginx_err: null } })).toBe('success')
  })
})

describe('getStatusIcon', () => {
  it('renders Cancel icon when item is disabled', () => {
    const item = { enabled: false, meta: { nginx_online: true, nginx_err: null } }
    const { container } = render(<>{getStatusIcon(item)}</>)
    expect(container.querySelector('svg[data-testid="CancelIcon"]')).toBeInTheDocument()
  })

  it('renders Error icon when enabled but offline', () => {
    const item = { enabled: true, meta: { nginx_online: false, nginx_err: 'Error' } }
    const { container } = render(<>{getStatusIcon(item)}</>)
    expect(container.querySelector('svg[data-testid="ErrorIcon"]')).toBeInTheDocument()
  })

  it('renders CheckCircle icon when enabled and online', () => {
    const item = { enabled: true, meta: { nginx_online: true, nginx_err: null } }
    const { container } = render(<>{getStatusIcon(item)}</>)
    expect(container.querySelector('svg[data-testid="CheckCircleIcon"]')).toBeInTheDocument()
  })
})
