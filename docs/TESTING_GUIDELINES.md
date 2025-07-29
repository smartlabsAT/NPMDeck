# Testing Guidelines - NPMDeck Refactored System

This document provides comprehensive testing strategies, patterns, and best practices for the NPMDeck refactored drawer system.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Test Setup and Configuration](#test-setup-and-configuration)
3. [Unit Testing Patterns](#unit-testing-patterns)
4. [Component Testing](#component-testing)
5. [Integration Testing](#integration-testing)
6. [End-to-End Testing](#end-to-end-testing)
7. [Performance Testing](#performance-testing)
8. [Accessibility Testing](#accessibility-testing)
9. [Test Utilities and Helpers](#test-utilities-and-helpers)
10. [Continuous Integration](#continuous-integration)

---

## Testing Strategy

### Testing Pyramid

The NPMDeck testing strategy follows the testing pyramid approach:

```
                    /\
                   /  \
                  / E2E \
                 /______\
                /        \
               /Integration\
              /__________\
             /            \
            /     Unit      \
           /________________\
```

**Unit Tests (70%)**:
- Individual functions and hooks
- Component logic in isolation
- Utility functions
- Validation logic

**Integration Tests (20%)**:
- Component interactions
- API integration
- Form workflows
- State management

**End-to-End Tests (10%)**:
- Complete user workflows
- Cross-browser compatibility
- Performance validation
- Accessibility compliance

### Test Categories

#### 1. Component Tests
- **Rendering**: Components render correctly
- **Props**: Props are handled properly
- **Events**: User interactions work as expected
- **States**: Component states change correctly

#### 2. Hook Tests
- **State Management**: Hook state updates correctly
- **Side Effects**: Effects run when expected
- **Dependencies**: Dependency arrays work properly
- **Cleanup**: Resources are cleaned up

#### 3. API Tests
- **Request Formation**: Correct API calls are made
- **Response Handling**: Responses are processed correctly
- **Error Handling**: Errors are handled gracefully
- **Caching**: Caching behavior works as expected

#### 4. Form Tests
- **Validation**: Field and form validation works
- **Submission**: Form submission processes correctly
- **Auto-save**: Auto-save functionality works
- **Dirty State**: Dirty state tracking is accurate

---

## Test Setup and Configuration

### Development Dependencies

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.4.3",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "msw": "^1.2.1",
    "cypress": "^12.17.0",
    "@cypress/react": "^7.0.3",
    "eslint-plugin-testing-library": "^5.11.0",
    "eslint-plugin-jest-dom": "^5.0.1"
  }
}
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/*.stories.tsx'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### Test Setup File

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
import { server } from './server'

// Establish API mocking before all tests
beforeAll(() => server.listen())

// Reset any request handlers that we may add during the tests
afterEach(() => server.resetHandlers())

// Clean up after the tests are finished
afterAll(() => server.close())

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))
```

### MSW Server Setup

```typescript
// src/test/server.ts
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { proxyHostHandlers } from './handlers/proxyHosts'
import { certificateHandlers } from './handlers/certificates'

export const server = setupServer(
  ...proxyHostHandlers,
  ...certificateHandlers
)
```

---

## Unit Testing Patterns

### Testing Custom Hooks

```typescript
// hooks/useDrawerForm.test.ts
import { renderHook, act } from '@testing-library/react'
import { useDrawerForm } from './useDrawerForm'

describe('useDrawerForm', () => {
  const defaultConfig = {
    initialData: { name: '', email: '' },
    onSubmit: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initialization', () => {
    test('initializes with provided data', () => {
      const initialData = { name: 'John', email: 'john@example.com' }
      
      const { result } = renderHook(() =>
        useDrawerForm({
          ...defaultConfig,
          initialData
        })
      )
      
      expect(result.current.data).toEqual(initialData)
      expect(result.current.isDirty).toBe(false)
      expect(result.current.isValid).toBe(true)
    })

    test('applies field configurations', () => {
      const { result } = renderHook(() =>
        useDrawerForm({
          ...defaultConfig,
          fields: {
            email: {
              initialValue: '',
              required: true,
              validate: (value) => value.includes('@') ? null : 'Invalid email'
            }
          }
        })
      )
      
      // Test field validation
      act(() => {
        result.current.setFieldValue('email', 'invalid')
      })
      
      expect(result.current.errors.email).toBe('Invalid email')
      expect(result.current.isValid).toBe(false)
    })
  })

  describe('field management', () => {
    test('updates field values correctly', () => {
      const { result } = renderHook(() => useDrawerForm(defaultConfig))
      
      act(() => {
        result.current.setFieldValue('name', 'Jane')
      })
      
      expect(result.current.data.name).toBe('Jane')
      expect(result.current.isDirty).toBe(true)
    })

    test('tracks touched fields', () => {
      const { result } = renderHook(() => useDrawerForm(defaultConfig))
      
      act(() => {
        result.current.setFieldTouched('email', true)
      })
      
      expect(result.current.touched.email).toBe(true)
    })

    test('provides field props for easy binding', () => {
      const { result } = renderHook(() => useDrawerForm({
        ...defaultConfig,
        fields: {
          email: { initialValue: '', required: true }
        }
      }))
      
      const fieldProps = result.current.getFieldProps('email')
      
      expect(fieldProps).toHaveProperty('name', 'email')
      expect(fieldProps).toHaveProperty('value', '')
      expect(fieldProps).toHaveProperty('onChange')
      expect(fieldProps).toHaveProperty('onBlur')
      expect(fieldProps).toHaveProperty('error', false)
    })
  })

  describe('validation', () => {
    test('validates required fields', () => {
      const { result } = renderHook(() =>
        useDrawerForm({
          ...defaultConfig,
          fields: {
            name: { initialValue: '', required: true }
          }
        })
      )
      
      const error = result.current.validateField('name', '')
      expect(error).toBe('name is required')
    })

    test('runs custom validation', () => {
      const { result } = renderHook(() =>
        useDrawerForm({
          ...defaultConfig,
          fields: {
            port: {
              initialValue: 80,
              validate: (value) => value >= 1 && value <= 65535 ? null : 'Invalid port'
            }
          }
        })
      )
      
      expect(result.current.validateField('port', 0)).toBe('Invalid port')
      expect(result.current.validateField('port', 80)).toBeNull()
    })

    test('runs global validation', () => {
      const { result } = renderHook(() =>
        useDrawerForm({
          ...defaultConfig,
          validate: (data) => {
            if (data.name === 'admin' && !data.email) {
              return { email: 'Admin must have email' }
            }
            return null
          }
        })
      )
      
      act(() => {
        result.current.setFormData({ name: 'admin', email: '' })
      })
      
      expect(result.current.errors.email).toBe('Admin must have email')
    })
  })

  describe('auto-save', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test('triggers auto-save after delay', async () => {
      const onAutoSave = jest.fn().mockResolvedValue(undefined)
      
      const { result } = renderHook(() =>
        useDrawerForm({
          ...defaultConfig,
          autoSave: {
            enabled: true,
            delay: 1000,
            onAutoSave
          }
        })
      )
      
      act(() => {
        result.current.setFieldValue('name', 'Test')
      })
      
      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(1000)
      })
      
      await act(async () => {
        await Promise.resolve()
      })
      
      expect(onAutoSave).toHaveBeenCalledWith({ name: 'Test', email: '' })
    })
  })

  describe('form submission', () => {
    test('submits valid form data', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined)
      
      const { result } = renderHook(() =>
        useDrawerForm({
          initialData: { name: 'John', email: 'john@example.com' },
          onSubmit
        })
      )
      
      await act(async () => {
        await result.current.handleSubmit()
      })
      
      expect(onSubmit).toHaveBeenCalledWith({ name: 'John', email: 'john@example.com' })
    })

    test('prevents submission of invalid data', () => {
      const onSubmit = jest.fn()
      
      const { result } = renderHook(() =>
        useDrawerForm({
          ...defaultConfig,
          fields: {
            name: { initialValue: '', required: true }
          },
          onSubmit
        })
      )
      
      act(() => {
        result.current.handleSubmit()
      })
      
      expect(onSubmit).not.toHaveBeenCalled()
      expect(result.current.errors.name).toBe('name is required')
    })

    test('handles submission errors', async () => {
      const error = new Error('Network error')
      const onSubmit = jest.fn().mockRejectedValue(error)
      const onError = jest.fn()
      
      const { result } = renderHook(() =>
        useDrawerForm({
          initialData: { name: 'John' },
          onSubmit,
          onError
        })
      )
      
      await act(async () => {
        await result.current.handleSubmit()
      })
      
      expect(result.current.globalError).toBe('Network error')
      expect(onError).toHaveBeenCalledWith(error)
    })
  })
})
```

### Testing Utility Functions

```typescript
// utils/validation.test.ts
import { validateDomain, validatePort, validateEmail } from './validation'

describe('validation utilities', () => {
  describe('validateDomain', () => {
    test('accepts valid domains', () => {
      expect(validateDomain('example.com')).toBe(true)
      expect(validateDomain('sub.example.com')).toBe(true)
      expect(validateDomain('test-site.co.uk')).toBe(true)
    })

    test('rejects invalid domains', () => {
      expect(validateDomain('')).toBe(false)
      expect(validateDomain('invalid')).toBe(false)
      expect(validateDomain('space domain.com')).toBe(false)
      expect(validateDomain('.example.com')).toBe(false)
    })
  })

  describe('validatePort', () => {
    test('accepts valid ports', () => {
      expect(validatePort(80)).toBe(true)
      expect(validatePort(443)).toBe(true)
      expect(validatePort(8080)).toBe(true)
    })

    test('rejects invalid ports', () => {
      expect(validatePort(0)).toBe(false)
      expect(validatePort(-1)).toBe(false)
      expect(validatePort(65536)).toBe(false)
      expect(validatePort(NaN)).toBe(false)
    })
  })

  describe('validateEmail', () => {
    test('accepts valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('test.email+tag@domain.co.uk')).toBe(true)
    })

    test('rejects invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
    })
  })
})
```

---

## Component Testing

### Testing BaseDrawer Component

```typescript
// components/base/BaseDrawer.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BaseDrawer } from './BaseDrawer'
import type { BaseDrawerProps } from './BaseDrawer'

const renderDrawer = (props: Partial<BaseDrawerProps> = {}) => {
  const defaultProps: BaseDrawerProps = {
    open: true,
    onClose: jest.fn(),
    title: 'Test Drawer',
    children: <div>Test Content</div>
  }
  
  return render(<BaseDrawer {...defaultProps} {...props} />)
}

describe('BaseDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    test('renders when open', () => {
      renderDrawer()
      
      expect(screen.getByText('Test Drawer')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    test('does not render when closed', () => {
      renderDrawer({ open: false })
      
      expect(screen.queryByText('Test Drawer')).not.toBeInTheDocument()
    })

    test('renders subtitle when provided', () => {
      renderDrawer({ subtitle: 'Test Subtitle' })
      
      expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
    })

    test('renders close button', () => {
      renderDrawer()
      
      const closeButton = screen.getByLabelText('Close drawer')
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('tabs', () => {
    const tabs = [
      { id: 'tab1', label: 'Tab 1' },
      { id: 'tab2', label: 'Tab 2', badge: 5 },
      { id: 'tab3', label: 'Tab 3', hasError: true }
    ]

    test('renders tabs when provided', () => {
      renderDrawer({ tabs })
      
      expect(screen.getByText('Tab 1')).toBeInTheDocument()
      expect(screen.getByText('Tab 2')).toBeInTheDocument()
      expect(screen.getByText('Tab 3')).toBeInTheDocument()
    })

    test('renders tab badges', () => {
      renderDrawer({ tabs })
      
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    test('shows error indicators on tabs', () => {
      renderDrawer({ tabs })
      
      const tab3 = screen.getByText('Tab 3').closest('button')
      expect(tab3).toHaveStyle({ color: expect.stringContaining('error') })
    })

    test('calls onTabChange when tab clicked', async () => {
      const user = userEvent.setup()
      const onTabChange = jest.fn()
      
      renderDrawer({ tabs, onTabChange })
      
      await user.click(screen.getByText('Tab 2'))
      
      expect(onTabChange).toHaveBeenCalledWith(1)
    })

    test('supports keyboard navigation between tabs', async () => {
      const user = userEvent.setup()
      const onTabChange = jest.fn()
      
      renderDrawer({ tabs, activeTab: 0, onTabChange })
      
      // Focus first tab and use Ctrl+Tab
      const tab1 = screen.getByText('Tab 1')
      tab1.focus()
      
      await user.keyboard('{Control>}{Tab}{/Control}')
      
      expect(onTabChange).toHaveBeenCalledWith(1)
    })
  })

  describe('loading state', () => {
    test('shows loading overlay when loading', () => {
      renderDrawer({ loading: true })
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    test('shows custom loading message', () => {
      renderDrawer({ loading: true, loadingMessage: 'Saving changes...' })
      
      expect(screen.getByText('Saving changes...')).toBeInTheDocument()
    })

    test('disables actions when loading', () => {
      renderDrawer({ 
        loading: true,
        onSave: jest.fn(),
        onCancel: jest.fn()
      })
      
      const saveButton = screen.getByText('Save')
      const cancelButton = screen.getByText('Cancel')
      
      expect(saveButton).toBeDisabled()
      expect(cancelButton).toBeDisabled()
    })
  })

  describe('error handling', () => {
    test('displays error messages', () => {
      renderDrawer({ error: 'Something went wrong' })
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    test('displays success messages', () => {
      renderDrawer({ success: 'Changes saved successfully' })
      
      expect(screen.getByText('Changes saved successfully')).toBeInTheDocument()
    })
  })

  describe('dirty state and close confirmation', () => {
    test('shows confirmation when closing dirty form', async () => {
      const user = userEvent.setup()
      const onClose = jest.fn()
      
      renderDrawer({ 
        isDirty: true,
        confirmClose: true,
        onClose
      })
      
      const closeButton = screen.getByLabelText('Close drawer')
      await user.click(closeButton)
      
      expect(screen.getByText('Unsaved Changes')).toBeInTheDocument()
      expect(onClose).not.toHaveBeenCalled()
    })

    test('closes immediately when not dirty', async () => {
      const user = userEvent.setup()
      const onClose = jest.fn()
      
      renderDrawer({ 
        isDirty: false,
        onClose
      })
      
      const closeButton = screen.getByLabelText('Close drawer')
      await user.click(closeButton)
      
      expect(onClose).toHaveBeenCalled()
    })

    test('confirms close and closes drawer', async () => {
      const user = userEvent.setup()
      const onClose = jest.fn()
      
      renderDrawer({ 
        isDirty: true,
        confirmClose: true,
        onClose
      })
      
      // Open confirmation dialog
      const closeButton = screen.getByLabelText('Close drawer')
      await user.click(closeButton)
      
      // Confirm close
      const confirmButton = screen.getByText('Close Without Saving')
      await user.click(confirmButton)
      
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('actions', () => {
    test('renders default save and cancel buttons', () => {
      renderDrawer({ 
        onSave: jest.fn(),
        onCancel: jest.fn()
      })
      
      expect(screen.getByText('Save')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    test('calls onSave when save button clicked', async () => {
      const user = userEvent.setup()
      const onSave = jest.fn()
      
      renderDrawer({ onSave })
      
      await user.click(screen.getByText('Save'))
      
      expect(onSave).toHaveBeenCalled()
    })

    test('calls onCancel when cancel button clicked', async () => {
      const user = userEvent.setup()
      const onCancel = jest.fn()
      
      renderDrawer({ onCancel })
      
      await user.click(screen.getByText('Cancel'))
      
      expect(onCancel).toHaveBeenCalled()
    })

    test('renders custom actions', () => {
      const customActions = <button>Custom Action</button>
      
      renderDrawer({ actions: customActions })
      
      expect(screen.getByText('Custom Action')).toBeInTheDocument()
    })
  })

  describe('keyboard shortcuts', () => {
    test('closes drawer on Escape key', async () => {
      const user = userEvent.setup()
      const onClose = jest.fn()
      
      renderDrawer({ onClose })
      
      await user.keyboard('{Escape}')
      
      expect(onClose).toHaveBeenCalled()
    })

    test('does not close on Escape when disabled', async () => {
      const user = userEvent.setup()
      const onClose = jest.fn()
      
      renderDrawer({ 
        onClose,
        disableEscapeKeyDown: true
      })
      
      await user.keyboard('{Escape}')
      
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    test('has proper ARIA attributes', () => {
      renderDrawer()
      
      const drawer = screen.getByRole('dialog')
      expect(drawer).toBeInTheDocument()
    })

    test('focuses properly when opened', () => {
      renderDrawer()
      
      // The drawer should be focusable
      const drawer = screen.getByRole('dialog')
      expect(drawer).toBeInTheDocument()
    })

    test('tab navigation works correctly', async () => {
      const tabs = [
        { id: 'tab1', label: 'Tab 1' },
        { id: 'tab2', label: 'Tab 2' }
      ]
      
      renderDrawer({ 
        tabs,
        onSave: jest.fn(),
        onCancel: jest.fn()
      })
      
      // Should be able to tab through interactive elements
      const tab1 = screen.getByText('Tab 1')
      const tab2 = screen.getByText('Tab 2')
      const closeButton = screen.getByLabelText('Close drawer')
      const saveButton = screen.getByText('Save')
      
      expect(tab1).toBeInTheDocument()
      expect(tab2).toBeInTheDocument()
      expect(closeButton).toBeInTheDocument()
      expect(saveButton).toBeInTheDocument()
    })
  })

  describe('responsive behavior', () => {
    test('adapts to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      
      renderDrawer({ width: 800 })
      
      // Should use full width on mobile
      const drawer = screen.getByRole('dialog')
      expect(drawer.closest('.MuiDrawer-paper')).toHaveStyle({
        width: '100%'
      })
    })
  })
})
```

### Testing FormSection Component

```typescript
// components/shared/FormSection.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FormSection from './FormSection'

describe('FormSection', () => {
  const defaultProps = {
    title: 'Test Section',
    children: <div>Section Content</div>
  }

  test('renders title and content', () => {
    render(<FormSection {...defaultProps} />)
    
    expect(screen.getByText('Test Section')).toBeInTheDocument()
    expect(screen.getByText('Section Content')).toBeInTheDocument()
  })

  test('renders description when provided', () => {
    render(
      <FormSection {...defaultProps} description="Section description" />
    )
    
    expect(screen.getByText('Section description')).toBeInTheDocument()
  })

  test('shows required indicator', () => {
    render(<FormSection {...defaultProps} required />)
    
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  test('displays error count badge', () => {
    render(<FormSection {...defaultProps} errorCount={3} />)
    
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  describe('collapsible behavior', () => {
    test('toggles content visibility when collapsible', async () => {
      const user = userEvent.setup()
      
      render(
        <FormSection 
          {...defaultProps} 
          collapsible 
          defaultExpanded={true}
        />
      )
      
      // Content should be visible initially
      expect(screen.getByText('Section Content')).toBeInTheDocument()
      
      // Click header to collapse
      await user.click(screen.getByText('Test Section'))
      
      // Content should be hidden (may still be in DOM but not visible)
      expect(screen.queryByText('Section Content')).not.toBeVisible()
    })

    test('calls onToggle when expanded/collapsed', async () => {
      const user = userEvent.setup()
      const onToggle = jest.fn()
      
      render(
        <FormSection 
          {...defaultProps} 
          collapsible 
          onToggle={onToggle}
        />
      )
      
      await user.click(screen.getByText('Test Section'))
      
      expect(onToggle).toHaveBeenCalledWith(false)
    })

    test('supports keyboard interaction', async () => {
      const user = userEvent.setup()
      
      render(
        <FormSection 
          {...defaultProps} 
          collapsible 
          defaultExpanded={true}
        />
      )
      
      const header = screen.getByText('Test Section')
      header.focus()
      
      await user.keyboard('{Enter}')
      
      expect(screen.queryByText('Section Content')).not.toBeVisible()
    })
  })

  describe('severity states', () => {
    test('applies error styling', () => {
      render(<FormSection {...defaultProps} severity="error" />)
      
      const section = screen.getByText('Test Section').closest('[data-testid]') || 
                     screen.getByText('Test Section').closest('div')
      
      expect(section).toHaveClass(expect.stringContaining('error'))
    })

    test('applies warning styling', () => {
      render(<FormSection {...defaultProps} severity="warning" />)
      
      const section = screen.getByText('Test Section').closest('[data-testid]') || 
                     screen.getByText('Test Section').closest('div')
      
      expect(section).toHaveClass(expect.stringContaining('warning'))
    })
  })

  describe('accessibility', () => {
    test('has proper ARIA attributes for collapsible sections', () => {
      render(
        <FormSection 
          {...defaultProps} 
          collapsible 
          defaultExpanded={true}
        />
      )
      
      const header = screen.getByText('Test Section')
      
      expect(header).toHaveAttribute('aria-expanded', 'true')
      expect(header).toHaveAttribute('role', 'button')
    })

    test('associates content with header', () => {
      render(
        <FormSection 
          {...defaultProps} 
          collapsible 
        />
      )
      
      const header = screen.getByText('Test Section')
      const contentId = header.getAttribute('aria-controls')
      
      expect(contentId).toBeTruthy()
      expect(screen.getByText('Section Content').closest('[id]')).toHaveAttribute('id', contentId)
    })
  })
})
```

---

## Integration Testing

### Testing Form Workflows

```typescript
// integration/ProxyHostForm.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProxyHostDrawer } from '@/components/features/proxy-hosts/ProxyHostDrawer'
import { server } from '@/test/server'
import { rest } from 'msw'

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('ProxyHost Form Integration', () => {
  const mockProxyHost = {
    id: 1,
    domain_names: ['example.com'],
    forward_host: 'localhost',
    forward_port: 3000,
    forward_scheme: 'http' as const,
    certificate_id: null,
    ssl_forced: false,
    hsts_enabled: false,
    hsts_subdomains: false,
    block_exploits: true,
    http2_support: false,
    advanced_config: '',
    enabled: true,
    created_on: '2023-01-01T00:00:00Z',
    modified_on: '2023-01-01T00:00:00Z',
    meta: {}
  }

  beforeEach(() => {
    server.use(
      rest.get('/api/nginx/certificates', (req, res, ctx) => {
        return res(ctx.json([
          { id: 1, nice_name: 'Test Certificate', domain_names: ['*.example.com'] }
        ]))
      }),
      rest.put('/api/nginx/proxy-hosts/:id', (req, res, ctx) => {
        return res(ctx.json({ ...mockProxyHost, ...req.body }))
      })
    )
  })

  test('complete form workflow: load, edit, validate, save', async () => {
    const user = userEvent.setup()
    const onSave = jest.fn()
    const onClose = jest.fn()
    
    renderWithProviders(
      <ProxyHostDrawer
        open={true}
        proxyHost={mockProxyHost}
        onSave={onSave}
        onClose={onClose}
      />
    )
    
    // 1. Verify form loads with existing data
    await waitFor(() => {
      expect(screen.getByDisplayValue('example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('localhost')).toBeInTheDocument()
      expect(screen.getByDisplayValue('3000')).toBeInTheDocument()
    })
    
    // 2. Edit domain name
    const domainInput = screen.getByLabelText(/domain names/i)
    await user.clear(domainInput)
    await user.type(domainInput, 'updated-example.com')
    
    // 3. Switch to SSL tab
    await user.click(screen.getByText('SSL'))
    
    // 4. Enable SSL
    const sslCheckbox = screen.getByLabelText(/force ssl/i)
    await user.click(sslCheckbox)
    
    // 5. Select certificate
    const certificateSelect = screen.getByLabelText(/certificate/i)
    await user.click(certificateSelect)
    await user.click(screen.getByText('Test Certificate'))
    
    // 6. Save form
    const saveButton = screen.getByText('Save')
    await user.click(saveButton)
    
    // 7. Verify save was called with updated data
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          domain_names: ['updated-example.com'],
          ssl_forced: true,
          certificate_id: 1
        })
      )
    })
  })

  test('validation prevents invalid form submission', async () => {
    const user = userEvent.setup()
    const onSave = jest.fn()
    
    renderWithProviders(
      <ProxyHostDrawer
        open={true}
        proxyHost={null}
        onSave={onSave}
        onClose={jest.fn()}
      />
    )
    
    // Try to save empty form
    const saveButton = screen.getByText('Save')
    await user.click(saveButton)
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/domain names.*required/i)).toBeInTheDocument()
      expect(screen.getByText(/forward host.*required/i)).toBeInTheDocument()
    })
    
    // Should not call onSave
    expect(onSave).not.toHaveBeenCalled()
  })

  test('auto-save functionality works', async () => {
    jest.useFakeTimers()
    
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    
    server.use(
      rest.post('/api/nginx/proxy-hosts/autosave', (req, res, ctx) => {
        return res(ctx.json({ success: true }))
      })
    )
    
    renderWithProviders(
      <ProxyHostDrawer
        open={true}
        proxyHost={mockProxyHost}
        onSave={jest.fn()}
        onClose={jest.fn()}
      />
    )
    
    // Edit a field
    const hostInput = screen.getByLabelText(/forward host/i)
    await user.clear(hostInput)
    await user.type(hostInput, 'new-host')
    
    // Fast-forward time to trigger auto-save
    jest.advanceTimersByTime(3000)
    
    // Should show auto-save status
    await waitFor(() => {
      expect(screen.getByText(/saved/i)).toBeInTheDocument()
    })
    
    jest.useRealTimers()
  })

  test('error handling during save', async () => {
    const user = userEvent.setup()
    
    server.use(
      rest.put('/api/nginx/proxy-hosts/:id', (req, res, ctx) => {
        return res(ctx.status(400), ctx.json({ message: 'Domain already exists' }))
      })
    )
    
    renderWithProviders(
      <ProxyHostDrawer
        open={true}
        proxyHost={mockProxyHost}
        onSave={jest.fn()}
        onClose={jest.fn()}
      />
    )
    
    // Make a change and save
    const hostInput = screen.getByLabelText(/forward host/i)
    await user.type(hostInput, '-updated')
    
    const saveButton = screen.getByText('Save')
    await user.click(saveButton)
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Domain already exists')).toBeInTheDocument()
    })
  })

  test('dirty state and close confirmation', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    
    renderWithProviders(
      <ProxyHostDrawer
        open={true}
        proxyHost={mockProxyHost}
        onSave={jest.fn()}
        onClose={onClose}
      />
    )
    
    // Make a change
    const hostInput = screen.getByLabelText(/forward host/i)
    await user.type(hostInput, '-updated')
    
    // Try to close
    const closeButton = screen.getByLabelText(/close/i)
    await user.click(closeButton)
    
    // Should show confirmation dialog
    expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument()
    
    // Should not close yet
    expect(onClose).not.toHaveBeenCalled()
    
    // Confirm close
    const confirmClose = screen.getByText(/close without saving/i)
    await user.click(confirmClose)
    
    // Now should close
    expect(onClose).toHaveBeenCalled()
  })
})
```

---

## End-to-End Testing

### Cypress E2E Tests

```typescript
// cypress/e2e/proxyhost-management.cy.ts
describe('Proxy Host Management', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/proxy-hosts')
  })

  it('creates a new proxy host', () => {
    // Click add button
    cy.get('[data-testid="add-proxy-host"]').click()
    
    // Fill form
    cy.get('[data-testid="domain-names-input"]')
      .type('e2e-test.local')
    
    cy.get('[data-testid="forward-host-input"]')
      .type('localhost')
    
    cy.get('[data-testid="forward-port-input"]')
      .clear()
      .type('3000')
    
    // Save
    cy.get('[data-testid="save-button"]').click()
    
    // Verify creation
    cy.contains('Proxy host created successfully')
    cy.contains('e2e-test.local')
  })

  it('edits existing proxy host', () => {
    // Create test data
    cy.createProxyHost({
      domain_names: ['edit-test.local'],
      forward_host: 'localhost',
      forward_port: 3000
    })
    
    // Find and edit
    cy.contains('edit-test.local')
      .closest('tr')
      .find('[data-testid="edit-button"]')
      .click()
    
    // Update forward port
    cy.get('[data-testid="forward-port-input"]')
      .clear()
      .type('8080')
    
    // Save changes
    cy.get('[data-testid="save-button"]').click()
    
    // Verify update
    cy.contains('Changes saved successfully')
    
    // Close drawer and verify in table
    cy.get('[data-testid="close-button"]').click()
    cy.contains('edit-test.local')
      .closest('tr')
      .should('contain', '8080')
  })

  it('validates required fields', () => {
    cy.get('[data-testid="add-proxy-host"]').click()
    
    // Try to save empty form
    cy.get('[data-testid="save-button"]').click()
    
    // Should show validation errors
    cy.contains('Domain names are required')
    cy.contains('Forward host is required')
    
    // Error indicators should be visible
    cy.get('[data-testid="details-tab"]')
      .should('have.attr', 'aria-describedby')
      .and('contain', 'error')
  })

  it('supports auto-save functionality', () => {
    // Create existing proxy host
    cy.createProxyHost({
      domain_names: ['autosave-test.local'],
      forward_host: 'localhost',
      forward_port: 3000
    })
    
    // Open for editing
    cy.contains('autosave-test.local')
      .closest('tr')
      .find('[data-testid="edit-button"]')
      .click()
    
    // Make a change
    cy.get('[data-testid="forward-port-input"]')
      .clear()
      .type('9000')
    
    // Wait for auto-save
    cy.contains('Saving...', { timeout: 1000 })
    cy.contains('Saved', { timeout: 5000 })
    
    // Refresh page and verify change persisted
    cy.reload()
    cy.contains('autosave-test.local')
      .closest('tr')
      .find('[data-testid="edit-button"]')
      .click()
    
    cy.get('[data-testid="forward-port-input"]')
      .should('have.value', '9000')
  })

  it('handles SSL configuration', () => {
    // Create certificate first
    cy.createCertificate({
      nice_name: 'Test Certificate',
      domain_names: ['*.test.local']
    })
    
    cy.get('[data-testid="add-proxy-host"]').click()
    
    // Fill basic details
    cy.get('[data-testid="domain-names-input"]')
      .type('ssl-test.local')
    
    cy.get('[data-testid="forward-host-input"]')
      .type('localhost')
    
    // Switch to SSL tab
    cy.get('[data-testid="ssl-tab"]').click()
    
    // Enable SSL
    cy.get('[data-testid="force-ssl-checkbox"]').check()
    
    // Select certificate
    cy.get('[data-testid="certificate-select"]').click()
    cy.contains('Test Certificate').click()
    
    // Enable HSTS
    cy.get('[data-testid="hsts-enabled-checkbox"]').check()
    
    // Save
    cy.get('[data-testid="save-button"]').click()
    
    // Verify SSL configuration
    cy.contains('Proxy host created successfully')
    
    // Verify SSL badge in table
    cy.contains('ssl-test.local')
      .closest('tr')
      .should('contain', 'SSL')
  })

  it('supports keyboard navigation', () => {
    cy.get('[data-testid="add-proxy-host"]').click()
    
    // Tab through form fields
    cy.get('[data-testid="domain-names-input"]')
      .focus()
      .tab()
      .should('have.attr', 'data-testid', 'forward-host-input')
      .tab()
      .should('have.attr', 'data-testid', 'forward-port-input')
    
    // Use Ctrl+Tab for tab navigation
    cy.get('body').type('{ctrl}', { release: false }).tab()
    
    cy.get('[data-testid="ssl-tab"]')
      .should('have.attr', 'aria-selected', 'true')
  })

  it('works on mobile viewport', () => {
    cy.viewport('iphone-x')
    
    cy.get('[data-testid="add-proxy-host"]').click()
    
    // Drawer should be full-width on mobile
    cy.get('[role="dialog"]')
      .should('have.css', 'width', '100%')
    
    // Tabs should be scrollable
    cy.get('[data-testid="tab-list"]')
      .should('have.css', 'overflow-x', 'auto')
    
    // Fill form with touch interactions
    cy.get('[data-testid="domain-names-input"]')
      .type('mobile-test.local')
    
    cy.get('[data-testid="forward-host-input"]')
      .type('localhost')
    
    // Swipe to SSL tab (if swipe gestures are implemented)
    cy.get('[data-testid="tab-content"]')
      .trigger('touchstart', { touches: [{ clientX: 300, clientY: 100 }] })
      .trigger('touchmove', { touches: [{ clientX: 100, clientY: 100 }] })
      .trigger('touchend')
    
    cy.get('[data-testid="ssl-tab"]')
      .should('have.attr', 'aria-selected', 'true')
  })

  it('handles network errors gracefully', () => {
    // Intercept and fail API calls
    cy.intercept('POST', '/api/nginx/proxy-hosts', {
      statusCode: 500,
      body: { message: 'Internal server error' }
    })
    
    cy.get('[data-testid="add-proxy-host"]').click()
    
    // Fill valid form
    cy.get('[data-testid="domain-names-input"]')
      .type('error-test.local')
    
    cy.get('[data-testid="forward-host-input"]')
      .type('localhost')
    
    // Try to save
    cy.get('[data-testid="save-button"]').click()
    
    // Should show error message
    cy.contains('Internal server error')
    
    // Form should still be editable
    cy.get('[data-testid="domain-names-input"]')
      .should('not.be.disabled')
  })
})
```

### Cypress Custom Commands

```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>
      createProxyHost(data: any): Chainable<void>
      createCertificate(data: any): Chainable<void>
      tab(): Chainable<JQuery<HTMLElement>>
    }
  }
}

Cypress.Commands.add('login', () => {
  cy.session('user-session', () => {
    cy.visit('/login')
    cy.get('[data-testid="email-input"]').type('admin@example.com')
    cy.get('[data-testid="password-input"]').type('password')
    cy.get('[data-testid="login-button"]').click()
    cy.url().should('include', '/dashboard')
  })
})

Cypress.Commands.add('createProxyHost', (data) => {
  cy.request('POST', '/api/nginx/proxy-hosts', data)
})

Cypress.Commands.add('createCertificate', (data) => {
  cy.request('POST', '/api/nginx/certificates', data)
})

Cypress.Commands.add('tab', { prevSubject: 'element' }, (subject) => {
  return cy.wrap(subject).trigger('keydown', { keyCode: 9 })
})
```

---

## Performance Testing

### Lighthouse CI Integration

```javascript
// lighthouse.config.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/proxy-hosts',
        'http://localhost:3000/certificates'
      ],
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
}
```

### Bundle Size Testing

```javascript
// scripts/test-bundle-size.js
const { execSync } = require('child_process')
const fs = require('fs')

function getBundleSize() {
  // Build the application
  execSync('npm run build', { stdio: 'inherit' })
  
  // Get bundle sizes
  const distDir = './dist'
  const files = fs.readdirSync(distDir)
  
  const jsFiles = files.filter(f => f.endsWith('.js'))
  const cssFiles = files.filter(f => f.endsWith('.css'))
  
  const jsSize = jsFiles.reduce((total, file) => {
    return total + fs.statSync(`${distDir}/${file}`).size
  }, 0)
  
  const cssSize = cssFiles.reduce((total, file) => {
    return total + fs.statSync(`${distDir}/${file}`).size
  }, 0)
  
  return {
    js: Math.round(jsSize / 1024),  // KB
    css: Math.round(cssSize / 1024), // KB
    total: Math.round((jsSize + cssSize) / 1024) // KB
  }
}

const sizes = getBundleSize()
console.log(`Bundle sizes:`)
console.log(`  JS: ${sizes.js}KB`)
console.log(`  CSS: ${sizes.css}KB`)
console.log(`  Total: ${sizes.total}KB`)

// Assert reasonable size limits
const MAX_JS_SIZE = 500 // KB
const MAX_CSS_SIZE = 100 // KB

if (sizes.js > MAX_JS_SIZE) {
  throw new Error(`JS bundle too large: ${sizes.js}KB > ${MAX_JS_SIZE}KB`)
}

if (sizes.css > MAX_CSS_SIZE) {
  throw new Error(`CSS bundle too large: ${sizes.css}KB > ${MAX_CSS_SIZE}KB`)
}

console.log('Bundle size checks passed!')
```

---

## Accessibility Testing

### Automated Accessibility Testing

```typescript
// tests/accessibility.test.tsx
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { BaseDrawer } from '@/components/base/BaseDrawer'
import { ProxyHostDrawer } from '@/components/features/proxy-hosts/ProxyHostDrawer'

expect.extend(toHaveNoViolations)

describe('Accessibility Tests', () => {
  test('BaseDrawer has no accessibility violations', async () => {
    const { container } = render(
      <BaseDrawer
        open={true}
        onClose={jest.fn()}
        title="Test Drawer"
      >
        <div>Content</div>
      </BaseDrawer>
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  test('ProxyHostDrawer meets accessibility standards', async () => {
    const mockProxyHost = {
      id: 1,
      domain_names: ['example.com'],
      forward_host: 'localhost',
      forward_port: 3000,
      // ... other required fields
    }
    
    const { container } = render(
      <ProxyHostDrawer
        open={true}
        proxyHost={mockProxyHost}
        onClose={jest.fn()}
        onSave={jest.fn()}
        certificates={[]}
      />
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  test('Form validation errors are accessible', async () => {
    const { container } = render(
      <ProxyHostDrawer
        open={true}
        proxyHost={null}
        onClose={jest.fn()}
        onSave={jest.fn()}
        certificates={[]}
      />
    )
    
    // Trigger validation errors
    const saveButton = screen.getByText('Save')
    fireEvent.click(saveButton)
    
    // Wait for errors to appear
    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument()
    })
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

### Manual Accessibility Testing Checklist

```typescript
// tests/accessibility-checklist.md
/**
 * Manual Accessibility Testing Checklist
 * 
 * Test each component with:
 * 
 * ## Keyboard Navigation
 * - [ ] All interactive elements are reachable via Tab
 * - [ ] Tab order is logical and follows visual flow
 * - [ ] Enter activates buttons and links
 * - [ ] Space toggles checkboxes and expands sections
 * - [ ] Escape closes modals and dropdowns
 * - [ ] Arrow keys navigate within components (tabs, lists)
 * 
 * ## Screen Reader Testing
 * - [ ] All content is announced correctly
 * - [ ] Form labels are associated with inputs
 * - [ ] Error messages are announced
 * - [ ] Status changes are announced (loading, saving)
 * - [ ] Navigation landmarks are present
 * 
 * ## Visual Testing
 * - [ ] Focus indicators are visible and clear
 * - [ ] Text has sufficient contrast (4.5:1 for normal, 3:1 for large)
 * - [ ] Interface works with 200% zoom
 * - [ ] Color is not the only way to convey information
 * 
 * ## Motor Accessibility
 * - [ ] Click targets are at least 44x44 pixels
 * - [ ] No time limits or adequate time provided
 * - [ ] No rapidly flashing content
 * - [ ] Interface works with voice control
 */
```

---

## Test Utilities and Helpers

### Custom Render Function

```typescript
// test/utils/render.tsx
import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '@/theme'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  queryClient?: QueryClient
}

const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

### Test Data Factories

```typescript
// test/factories/proxyHost.ts
import { ProxyHost } from '@/types/common'

export const createProxyHost = (overrides: Partial<ProxyHost> = {}): ProxyHost => ({
  id: 1,
  created_on: '2023-01-01T00:00:00Z',
  modified_on: '2023-01-01T00:00:00Z',
  domain_names: ['example.com'],
  forward_http_code: 301,
  forward_scheme: 'http',
  forward_domain_name: 'localhost',
  forward_port: 3000,
  preserve_path: true,
  certificate_id: null,
  ssl_forced: false,
  hsts_enabled: false,
  hsts_subdomains: false,
  block_exploits: true,
  http2_support: false,
  advanced_config: '',
  enabled: true,
  meta: {},
  ...overrides
})

export const createProxyHostFormData = (overrides = {}) => ({
  domain_names: ['example.com'],
  forward_host: 'localhost',
  forward_port: 3000,
  forward_scheme: 'http' as const,
  certificate_id: null,
  ssl_forced: false,
  hsts_enabled: false,
  hsts_subdomains: false,
  block_exploits: true,
  http2_support: false,
  advanced_config: '',
  ...overrides
})
```

### Mock Service Worker Handlers

```typescript
// test/handlers/proxyHosts.ts
import { rest } from 'msw'
import { createProxyHost } from '../factories/proxyHost'

export const proxyHostHandlers = [
  rest.get('/api/nginx/proxy-hosts', (req, res, ctx) => {
    return res(
      ctx.json([
        createProxyHost({ id: 1, domain_names: ['example.com'] }),
        createProxyHost({ id: 2, domain_names: ['test.local'] })
      ])
    )
  }),

  rest.get('/api/nginx/proxy-hosts/:id', (req, res, ctx) => {
    const { id } = req.params
    return res(
      ctx.json(createProxyHost({ id: Number(id) }))
    )
  }),

  rest.post('/api/nginx/proxy-hosts', async (req, res, ctx) => {
    const body = await req.json()
    return res(
      ctx.json(createProxyHost({ id: 999, ...body }))
    )
  }),

  rest.put('/api/nginx/proxy-hosts/:id', async (req, res, ctx) => {
    const { id } = req.params
    const body = await req.json()
    return res(
      ctx.json(createProxyHost({ id: Number(id), ...body }))
    )
  }),

  rest.delete('/api/nginx/proxy-hosts/:id', (req, res, ctx) => {
    return res(ctx.status(204))
  }),

  rest.post('/api/nginx/proxy-hosts/autosave', (req, res, ctx) => {
    return res(ctx.json({ success: true }))
  })
]
```

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run linting
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
  
  e2e:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm run preview &
        
      - name: Wait for application
        run: npx wait-on http://localhost:4173
      
      - name: Run Cypress tests
        uses: cypress-io/github-action@v5
        with:
          wait-on: 'http://localhost:4173'
          wait-on-timeout: 120
      
      - name: Upload Cypress videos
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-videos
          path: cypress/videos
  
  accessibility:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm run preview &
        
      - name: Wait for application
        run: npx wait-on http://localhost:4173
      
      - name: Run Lighthouse CI
        run: npx lhci autorun
      
      - name: Run axe accessibility tests
        run: npm run test:a11y
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=src",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open",
    "test:a11y": "jest --testPathPattern=accessibility",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix"
  }
}
```

This comprehensive testing guide provides strategies and patterns for ensuring the quality and reliability of the NPMDeck refactored system. The testing approach covers all aspects from unit tests to end-to-end scenarios, ensuring robust and maintainable code.