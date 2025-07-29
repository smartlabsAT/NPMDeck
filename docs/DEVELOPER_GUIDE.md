# Developer Guide - NPMDeck Refactored System

This guide provides comprehensive information for developers working with the refactored NPMDeck drawer system.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Migration Guide](#migration-guide)
3. [Development Best Practices](#development-best-practices)
4. [TypeScript Guidelines](#typescript-guidelines)
5. [Testing Patterns](#testing-patterns)
6. [Performance Optimization](#performance-optimization)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

```bash
# Required Node.js version
node --version  # >= 18.0.0

# Install dependencies
npm install
# or
pnpm install
```

### Project Structure

```
src/
├── components/
│   ├── base/                    # Base components (BaseDrawer, BaseDialog)
│   │   ├── BaseDrawer.tsx
│   │   ├── BaseDialog.tsx
│   │   └── README.md
│   ├── shared/                  # Shared utility components
│   │   ├── FormSection.tsx
│   │   ├── TabPanel.tsx
│   │   ├── ArrayFieldManager.tsx
│   │   └── index.ts
│   └── features/                # Feature-specific components
│       ├── proxy-hosts/
│       ├── certificates/
│       ├── access-lists/
│       └── index.ts
├── hooks/
│   ├── useDrawerForm.ts         # Advanced form management
│   ├── usePermissions.ts
│   └── index.ts
├── api/                         # API layer
│   ├── proxyHosts.ts
│   ├── certificates.ts
│   └── index.ts
└── types/
    ├── common.ts
    └── permissions.ts
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Configure development environment
export NODE_ENV=development
export VITE_API_URL=http://localhost:8181
```

---

## Migration Guide

### From Legacy Drawers to New System

#### Step 1: Identify Components to Migrate

```bash
# Find legacy drawer components
find src -name "*.tsx" -exec grep -l "Drawer.*component" {} \;
```

#### Step 2: Replace Legacy Components

**Before (Legacy):**
```tsx
// Old drawer implementation
const LegacyProxyHostDrawer = ({ open, onClose, data }) => {
  const [formData, setFormData] = useState(data)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  return (
    <Drawer open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <TextField
          value={formData.domain_names}
          onChange={handleDomainChange}
          error={!!errors.domain_names}
          helperText={errors.domain_names}
        />
        {/* ... more fields */}
      </form>
    </Drawer>
  )
}
```

**After (Refactored):**
```tsx
// New implementation using BaseDrawer + useDrawerForm
import { BaseDrawer } from '@/components/base/BaseDrawer'
import { useDrawerForm } from '@/hooks/useDrawerForm'
import { FormSection } from '@/components/shared/FormSection'

interface ProxyHostFormData {
  domain_names: string[]
  forward_host: string
  forward_port: number
  certificate_id?: number
}

const ProxyHostDrawer = ({ open, onClose, proxyHost, onSave }) => {
  const form = useDrawerForm<ProxyHostFormData>({
    initialData: {
      domain_names: proxyHost?.domain_names || [],
      forward_host: proxyHost?.forward_host || '',
      forward_port: proxyHost?.forward_port || 80,
      certificate_id: proxyHost?.certificate_id
    },
    fields: {
      domain_names: { 
        initialValue: [], 
        required: true,
        validate: (domains) => domains.length === 0 ? 'At least one domain required' : null
      },
      forward_host: { initialValue: '', required: true },
      forward_port: { 
        initialValue: 80,
        validate: (port) => port >= 1 && port <= 65535 ? null : 'Invalid port'
      }
    },
    onSubmit: async (data) => {
      await onSave(data)
      onClose()
    },
    autoSave: {
      enabled: true,
      delay: 2000,
      onAutoSave: async (data) => {
        await proxyHostsApi.autosave(data)
      }
    }
  })

  const tabs = [
    { id: 'details', label: 'Details', hasError: hasDetailsErrors(form.errors) },
    { id: 'ssl', label: 'SSL', badge: form.data.certificate_id ? '✓' : undefined }
  ]

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title="Edit Proxy Host"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      loading={form.loading}
      isDirty={form.isDirty}
      onSave={form.handleSubmit}
      error={form.globalError}
    >
      <TabPanel value={activeTab} index={0}>
        <FormSection title="Basic Settings" required>
          <DomainInput
            {...form.getFieldProps('domain_names')}
            label="Domain Names"
          />
          <TextField
            {...form.getFieldProps('forward_host')}
            label="Forward Host"
            required
          />
          <TextField
            {...form.getFieldProps('forward_port')}
            label="Forward Port"
            type="number"
            required
          />
        </FormSection>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <FormSection title="SSL Configuration">
          <CertificateSelector
            value={form.data.certificate_id}
            onChange={(certId) => form.setFieldValue('certificate_id', certId)}
          />
        </FormSection>
      </TabPanel>
    </BaseDrawer>
  )
}
```

#### Step 3: Update Component Exports

```tsx
// Update feature index files
// src/components/features/proxy-hosts/index.ts
export { ProxyHostDrawer } from './ProxyHostDrawer'
export type { ProxyHostFormData } from './ProxyHostDrawer'

// Update main component index
// src/components/index.ts
export * from './features/proxy-hosts'
export * from './base'
export * from './shared'
```

#### Step 4: Update Usage in Pages

```tsx
// Before
<LegacyProxyHostDrawer 
  open={drawerOpen}
  onClose={() => setDrawerOpen(false)}
  data={selectedHost}
/>

// After
<ProxyHostDrawer
  open={drawerOpen}
  onClose={() => setDrawerOpen(false)}
  proxyHost={selectedHost}
  onSave={handleSaveHost}
/>
```

### Migration Checklist

- [ ] Replace Drawer with BaseDrawer
- [ ] Implement useDrawerForm for state management
- [ ] Add proper TypeScript interfaces
- [ ] Update form validation logic
- [ ] Add auto-save functionality
- [ ] Implement proper error handling
- [ ] Add accessibility attributes
- [ ] Update tests
- [ ] Update documentation

---

## Development Best Practices

### Component Structure

```tsx
// 1. Imports (grouped and sorted)
import React, { useState, useCallback } from 'react'
import { TextField, Button } from '@mui/material'
import { BaseDrawer } from '@/components/base/BaseDrawer'
import { useDrawerForm } from '@/hooks/useDrawerForm'
import { proxyHostsApi } from '@/api/proxyHosts'

// 2. Type definitions
interface ComponentProps {
  // Props interface
}

interface FormData {
  // Form data interface
}

// 3. Component implementation
export const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 4. Form setup
  const form = useDrawerForm<FormData>({
    // Configuration
  })

  // 5. State and handlers
  const [localState, setLocalState] = useState()

  const handleAction = useCallback(async () => {
    // Implementation
  }, [dependencies])

  // 6. Render
  return (
    <BaseDrawer>
      {/* Component JSX */}
    </BaseDrawer>
  )
}

// 7. Default export
export default Component
```

### Form Management Best Practices

```tsx
// 1. Define comprehensive form data interface
interface ProxyHostFormData {
  domain_names: string[]
  forward_scheme: 'http' | 'https'
  forward_host: string
  forward_port: number
  certificate_id?: number
  ssl_forced: boolean
  hsts_enabled: boolean
  advanced_config: string
}

// 2. Configure validation rules
const form = useDrawerForm<ProxyHostFormData>({
  initialData: getInitialData(proxyHost),
  fields: {
    domain_names: {
      initialValue: [],
      required: true,
      validate: (domains) => {
        if (domains.length === 0) return 'At least one domain required'
        const invalidDomains = domains.filter(d => !isValidDomain(d))
        if (invalidDomains.length > 0) return `Invalid domains: ${invalidDomains.join(', ')}`
        return null
      }
    },
    forward_host: {
      initialValue: '',
      required: true,
      validate: (host) => {
        if (!host.trim()) return 'Forward host is required'
        if (!isValidHostname(host)) return 'Invalid hostname format'
        return null
      }
    },
    forward_port: {
      initialValue: 80,
      validate: (port) => {
        if (port < 1 || port > 65535) return 'Port must be between 1-65535'
        return null
      }
    }
  },
  // Global validation for cross-field rules
  validate: (data) => {
    const errors: Partial<Record<keyof ProxyHostFormData, string>> = {}
    
    if (data.ssl_forced && !data.certificate_id) {
      errors.certificate_id = 'Certificate required when SSL is forced'
    }
    
    if (data.forward_scheme === 'https' && data.forward_port === 80) {
      errors.forward_port = 'Consider using port 443 for HTTPS'
    }
    
    return Object.keys(errors).length > 0 ? errors : null
  }
})

// 3. Use field props for consistent binding
<TextField
  {...form.getFieldProps('forward_host')}
  label="Forward Host"
  placeholder="example.com"
  helperText={form.getFieldProps('forward_host').helperText || "Hostname or IP address"}
  required
/>
```

### Error Handling Patterns

```tsx
// 1. Component-level error boundaries
const ComponentWithErrorBoundary = () => (
  <ErrorBoundary fallback={<ErrorFallback />}>
    <YourComponent />
  </ErrorBoundary>
)

// 2. Form-level error handling
const form = useDrawerForm({
  // ... config
  onError: (error) => {
    // Log error for debugging
    console.error('Form submission error:', error)
    
    // Show user-friendly message
    toast.error(getUserFriendlyErrorMessage(error))
    
    // Track error for monitoring
    analytics.track('form_error', {
      component: 'ProxyHostDrawer',
      error: error.message
    })
  }
})

// 3. API error handling
const handleApiCall = async () => {
  try {
    const result = await proxyHostsApi.create(formData)
    return result
  } catch (error) {
    if (error.status === 422) {
      // Validation errors from server
      form.setErrors(error.validationErrors)
    } else if (error.status === 409) {
      // Conflict error
      form.setGlobalError('A proxy host with this domain already exists')
    } else {
      // Generic error
      throw error
    }
  }
}
```

### Performance Optimizations

```tsx
// 1. Memoize expensive computations
const memoizedOptions = useMemo(() => {
  return certificates.map(cert => ({
    value: cert.id,
    label: cert.nice_name,
    expires: cert.expires_on
  }))
}, [certificates])

// 2. Optimize re-renders with useCallback
const handleDomainChange = useCallback((domains: string[]) => {
  form.setFieldValue('domain_names', domains)
  
  // Update certificate recommendations based on domains
  updateCertificateRecommendations(domains)
}, [form.setFieldValue])

// 3. Lazy load heavy components
const AdvancedConfigEditor = lazy(() => import('./AdvancedConfigEditor'))

// 4. Use React.memo for stable components
const MemoizedFormSection = React.memo(FormSection)
```

---

## TypeScript Guidelines

### Interface Definitions

```tsx
// 1. Base interfaces for API data
interface BaseEntity {
  id: number
  created_on: string
  modified_on: string
  enabled: boolean
}

interface ProxyHost extends BaseEntity {
  domain_names: string[]
  forward_scheme: 'http' | 'https'
  forward_host: string
  forward_port: number
  certificate_id?: number
  ssl_forced: boolean
  hsts_enabled: boolean
  hsts_subdomains: boolean
  block_exploits: boolean
  advanced_config: string
  meta: ProxyHostMeta
}

interface ProxyHostMeta {
  nginx_online?: boolean
  nginx_err?: string | null
}

// 2. Form-specific interfaces
interface ProxyHostFormData extends Omit<ProxyHost, 'id' | 'created_on' | 'modified_on' | 'meta'> {
  // Add form-specific fields if needed
  _isNew?: boolean
}

// 3. Component prop interfaces
interface ProxyHostDrawerProps {
  open: boolean
  onClose: () => void
  proxyHost?: ProxyHost | null
  onSave: (data: ProxyHostFormData) => Promise<void>
  certificates: Certificate[]
  loading?: boolean
}
```

### Generic Types

```tsx
// 1. Generic form hook
const useEntityForm = <T extends Record<string, any>>(
  config: UseDrawerFormOptions<T>
) => {
  return useDrawerForm<T>(config)
}

// 2. Generic API functions
const createApiClient = <T, CreateT = Omit<T, 'id' | 'created_on' | 'modified_on'>>() => ({
  async getAll(): Promise<T[]> { /* implementation */ },
  async getById(id: number): Promise<T> { /* implementation */ },
  async create(data: CreateT): Promise<T> { /* implementation */ },
  async update(id: number, data: Partial<CreateT>): Promise<T> { /* implementation */ },
  async delete(id: number): Promise<void> { /* implementation */ }
})

// Usage
const proxyHostsApi = createApiClient<ProxyHost>()
```

### Type Guards

```tsx
// 1. Type guards for runtime checks
const isProxyHost = (obj: any): obj is ProxyHost => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    Array.isArray(obj.domain_names) &&
    typeof obj.forward_host === 'string'
  )
}

// 2. Form validation with type safety
const validateProxyHostData = (data: unknown): data is ProxyHostFormData => {
  if (!isObject(data)) return false
  
  const required: (keyof ProxyHostFormData)[] = [
    'domain_names',
    'forward_host',
    'forward_port',
    'forward_scheme'
  ]
  
  return required.every(key => key in data && data[key] != null)
}
```

---

## Testing Patterns

### Component Testing

```tsx
// 1. Test file structure
// ProxyHostDrawer.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProxyHostDrawer } from './ProxyHostDrawer'
import { proxyHostsApi } from '@/api/proxyHosts'

// Mock API
jest.mock('@/api/proxyHosts')
const mockProxyHostsApi = proxyHostsApi as jest.Mocked<typeof proxyHostsApi>

// Test utilities
const renderDrawer = (props: Partial<ProxyHostDrawerProps> = {}) => {
  const defaultProps: ProxyHostDrawerProps = {
    open: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    certificates: []
  }
  
  return render(<ProxyHostDrawer {...defaultProps} {...props} />)
}

describe('ProxyHostDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // 2. Basic rendering tests
  test('renders drawer with title', () => {
    renderDrawer()
    expect(screen.getByText('Edit Proxy Host')).toBeInTheDocument()
  })

  test('renders form fields', () => {
    renderDrawer()
    expect(screen.getByLabelText(/domain names/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/forward host/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/forward port/i)).toBeInTheDocument()
  })

  // 3. Validation tests
  test('shows validation errors for required fields', async () => {
    const user = userEvent.setup()
    renderDrawer()
    
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText(/at least one domain required/i)).toBeInTheDocument()
      expect(screen.getByText(/forward host is required/i)).toBeInTheDocument()
    })
  })

  // 4. Form interaction tests
  test('updates field values correctly', async () => {
    const user = userEvent.setup()
    renderDrawer()
    
    const hostInput = screen.getByLabelText(/forward host/i)
    await user.type(hostInput, 'example.com')
    
    expect(hostInput).toHaveValue('example.com')
  })

  // 5. Auto-save tests
  test('triggers auto-save after delay', async () => {
    jest.useFakeTimers()
    mockProxyHostsApi.autosave.mockResolvedValue()
    
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    renderDrawer()
    
    const hostInput = screen.getByLabelText(/forward host/i)
    await user.type(hostInput, 'example.com')
    
    // Fast-forward auto-save delay
    jest.advanceTimersByTime(3000)
    
    await waitFor(() => {
      expect(mockProxyHostsApi.autosave).toHaveBeenCalledWith(
        expect.objectContaining({ forward_host: 'example.com' })
      )
    })
    
    jest.useRealTimers()
  })

  // 6. Error handling tests
  test('displays error message on save failure', async () => {
    const user = userEvent.setup()
    const onSave = jest.fn().mockRejectedValue(new Error('Save failed'))
    
    renderDrawer({ onSave })
    
    // Fill required fields
    await user.type(screen.getByLabelText(/forward host/i), 'example.com')
    
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText(/save failed/i)).toBeInTheDocument()
    })
  })
})
```

### Hook Testing

```tsx
// useDrawerForm.test.ts
import { renderHook, act } from '@testing-library/react'
import { useDrawerForm } from './useDrawerForm'

describe('useDrawerForm', () => {
  test('initializes with provided data', () => {
    const initialData = { name: 'test', email: 'test@example.com' }
    
    const { result } = renderHook(() =>
      useDrawerForm({
        initialData,
        onSubmit: jest.fn()
      })
    )
    
    expect(result.current.data).toEqual(initialData)
    expect(result.current.isDirty).toBe(false)
  })

  test('validates fields correctly', () => {
    const { result } = renderHook(() =>
      useDrawerForm({
        initialData: { email: '' },
        fields: {
          email: {
            initialValue: '',
            required: true,
            validate: (value) => {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
              return emailRegex.test(value) ? null : 'Invalid email'
            }
          }
        },
        onSubmit: jest.fn()
      })
    )
    
    act(() => {
      result.current.setFieldValue('email', 'invalid-email')
    })
    
    expect(result.current.errors.email).toBe('Invalid email')
    expect(result.current.isValid).toBe(false)
  })

  test('tracks dirty state correctly', () => {
    const { result } = renderHook(() =>
      useDrawerForm({
        initialData: { name: 'initial' },
        onSubmit: jest.fn()
      })
    )
    
    expect(result.current.isDirty).toBe(false)
    
    act(() => {
      result.current.setFieldValue('name', 'changed')
    })
    
    expect(result.current.isDirty).toBe(true)
  })
})
```

### Integration Testing

```tsx
// ProxyHostManagement.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProxyHostsPage } from './ProxyHostsPage'
import { server } from '@/test/server'
import { rest } from 'msw'

describe('Proxy Host Management Integration', () => {
  test('complete flow: create, edit, delete proxy host', async () => {
    const user = userEvent.setup()
    render(<ProxyHostsPage />)
    
    // 1. Open create drawer
    const addButton = screen.getByRole('button', { name: /add proxy host/i })
    await user.click(addButton)
    
    // 2. Fill form
    await user.type(screen.getByLabelText(/domain names/i), 'example.com')
    await user.type(screen.getByLabelText(/forward host/i), 'localhost')
    await user.type(screen.getByLabelText(/forward port/i), '3000')
    
    // 3. Save
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)
    
    // 4. Verify creation
    await waitFor(() => {
      expect(screen.getByText('example.com')).toBeInTheDocument()
    })
    
    // 5. Edit proxy host
    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)
    
    // 6. Update field
    const hostInput = screen.getByLabelText(/forward host/i)
    await user.clear(hostInput)
    await user.type(hostInput, 'updated-host')
    
    // 7. Save changes
    await user.click(screen.getByRole('button', { name: /save/i }))
    
    // 8. Verify update
    await waitFor(() => {
      expect(screen.getByText('updated-host')).toBeInTheDocument()
    })
  })
})
```

---

## Performance Optimization

### Bundle Optimization

```tsx
// 1. Code splitting by feature
const ProxyHostsPage = lazy(() => import('./pages/ProxyHosts'))
const CertificatesPage = lazy(() => import('./pages/Certificates'))

// 2. Component-level splitting
const AdvancedConfigEditor = lazy(() => 
  import('./components/AdvancedConfigEditor').then(module => ({
    default: module.AdvancedConfigEditor
  }))
)

// 3. Preload critical components
const preloadComponents = () => {
  import('./components/ProxyHostDrawer')
  import('./components/CertificateDrawer')
}

// Preload after initial render
useEffect(() => {
  const timer = setTimeout(preloadComponents, 1000)
  return () => clearTimeout(timer)
}, [])
```

### React Optimizations

```tsx
// 1. Memoize expensive calculations
const memoizedData = useMemo(() => {
  return processLargeDataSet(rawData)
}, [rawData])

// 2. Optimize re-renders
const OptimizedComponent = React.memo(({ data, onUpdate }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data.id === nextProps.data.id &&
         prevProps.data.modified_on === nextProps.data.modified_on
})

// 3. Virtualize large lists
import { FixedSizeList as List } from 'react-window'

const VirtualizedProxyHostList = ({ items }) => (
  <List
    height={400}
    itemCount={items.length}
    itemSize={60}
    itemData={items}
  >
    {ProxyHostRow}
  </List>
)
```

### API Optimizations

```tsx
// 1. Request deduplication
const useProxyHosts = () => {
  return useQuery({
    queryKey: ['proxyHosts'],
    queryFn: proxyHostsApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// 2. Optimistic updates
const useUpdateProxyHost = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: proxyHostsApi.update,
    onMutate: async (updatedHost) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['proxyHosts'])
      
      // Snapshot previous value
      const previousHosts = queryClient.getQueryData(['proxyHosts'])
      
      // Optimistically update
      queryClient.setQueryData(['proxyHosts'], (old) =>
        old?.map(host => 
          host.id === updatedHost.id ? { ...host, ...updatedHost } : host
        )
      )
      
      return { previousHosts }
    },
    onError: (err, updatedHost, context) => {
      // Rollback on error
      queryClient.setQueryData(['proxyHosts'], context?.previousHosts)
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries(['proxyHosts'])
    }
  })
}

// 3. Pagination and infinite scroll
const useInfiniteProxyHosts = () => {
  return useInfiniteQuery({
    queryKey: ['proxyHosts', 'infinite'],
    queryFn: ({ pageParam = 0 }) => 
      proxyHostsApi.getAll({ page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage, allPages) => 
      lastPage.length === 20 ? allPages.length : undefined
  })
}
```

---

## Troubleshooting

### Common Issues

#### 1. Form Not Saving

**Symptoms:**
- Save button doesn't respond
- Form appears to submit but data doesn't persist
- No error messages shown

**Solutions:**
```tsx
// Check form validation
console.log('Form state:', {
  isValid: form.isValid,
  errors: form.errors,
  data: form.data
})

// Ensure onSubmit is async
const form = useDrawerForm({
  onSubmit: async (data) => {
    try {
      await proxyHostsApi.create(data)
      onClose()
    } catch (error) {
      console.error('Save failed:', error)
      throw error // Let the form handle the error
    }
  }
})
```

#### 2. Auto-save Not Working

**Symptoms:**
- Auto-save status remains 'idle'
- No auto-save API calls
- Changes lost when navigating away

**Solutions:**
```tsx
// Check auto-save configuration
const form = useDrawerForm({
  autoSave: {
    enabled: true,
    delay: 2000,
    onAutoSave: async (data) => {
      console.log('Auto-saving:', data)
      await proxyHostsApi.autosave(data)
      console.log('Auto-save complete')
    }
  }
})

// Monitor auto-save status
useEffect(() => {
  console.log('Auto-save status:', form.autoSaveStatus)
}, [form.autoSaveStatus])
```

#### 3. Validation Errors Not Showing

**Symptoms:**
- Fields don't show error states
- Form submits with invalid data
- Error messages not displayed

**Solutions:**
```tsx
// Ensure field is marked as touched
const fieldProps = form.getFieldProps('email')
console.log('Field props:', fieldProps)

// Manually trigger validation
useEffect(() => {
  form.validateAllFields(form.data)
}, [form.data])

// Check field configuration
const form = useDrawerForm({
  fields: {
    email: {
      required: true,
      validate: (value) => {
        console.log('Validating email:', value)
        const result = isValidEmail(value) ? null : 'Invalid email'
        console.log('Validation result:', result)
        return result
      }
    }
  }
})
```

#### 4. Performance Issues

**Symptoms:**
- Slow drawer opening
- Laggy form interactions
- High memory usage

**Solutions:**
```tsx
// 1. Identify performance bottlenecks
import { Profiler } from 'react'

const onRenderCallback = (id, phase, actualDuration) => {
  console.log('Render:', { id, phase, actualDuration })
}

<Profiler id="ProxyHostDrawer" onRender={onRenderCallback}>
  <ProxyHostDrawer />
</Profiler>

// 2. Optimize heavy computations
const expensiveValue = useMemo(() => {
  return heavyComputation(data)
}, [data])

// 3. Debounce frequent updates
const debouncedUpdate = useCallback(
  debounce((value) => {
    form.setFieldValue('field', value)
  }, 300),
  [form.setFieldValue]
)
```

### Debug Tools

```tsx
// 1. Form debug component
const FormDebugger = ({ form }) => {
  if (process.env.NODE_ENV !== 'development') return null
  
  return (
    <Box sx={{ position: 'fixed', bottom: 0, right: 0, p: 2, bgcolor: 'background.paper' }}>
      <Typography variant="h6">Form Debug</Typography>
      <pre>{JSON.stringify({
        data: form.data,
        errors: form.errors,
        isDirty: form.isDirty,
        isValid: form.isValid,
        loading: form.loading,
        autoSaveStatus: form.autoSaveStatus
      }, null, 2)}</pre>
    </Box>
  )
}

// Usage
<BaseDrawer>
  {/* Form content */}
  <FormDebugger form={form} />
</BaseDrawer>

// 2. API debug interceptor
if (process.env.NODE_ENV === 'development') {
  api.interceptors.request.use(request => {
    console.log('API Request:', request)
    return request
  })
  
  api.interceptors.response.use(
    response => {
      console.log('API Response:', response)
      return response
    },
    error => {
      console.error('API Error:', error)
      return Promise.reject(error)
    }
  )
}
```

### Error Reporting

```tsx
// 1. Error boundary with reporting
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Report to error tracking service
    errorTracker.captureException(error, {
      contexts: {
        react: errorInfo
      }
    })
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }
    
    return this.props.children
  }
}

// 2. Global error handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  errorTracker.captureException(event.reason)
})
```

This developer guide provides comprehensive information for working with the refactored NPMDeck system. For specific component usage, refer to the Component API Documentation.