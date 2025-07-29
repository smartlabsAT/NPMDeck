# Architecture Documentation - NPMDeck Refactored System

This document outlines the architectural patterns, design decisions, and system organization of the refactored NPMDeck drawer system.

## Table of Contents

1. [System Overview](#system-overview)
2. [Feature-based Architecture](#feature-based-architecture)
3. [Component Hierarchy](#component-hierarchy)
4. [State Management Patterns](#state-management-patterns)
5. [Data Flow Architecture](#data-flow-architecture)
6. [Performance Optimization Patterns](#performance-optimization-patterns)
7. [Design Patterns Used](#design-patterns-used)
8. [Scalability Considerations](#scalability-considerations)

---

## System Overview

The NPMDeck refactored system follows a **component-driven architecture** with emphasis on:

- **Separation of Concerns**: Clear boundaries between UI, logic, and data layers
- **Reusability**: Shared components and hooks across features
- **Type Safety**: Full TypeScript integration with strict typing
- **Performance**: Optimized rendering and state management
- **Accessibility**: WCAG compliance and keyboard navigation
- **Maintainability**: Clear patterns and consistent structure

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │     Pages       │ │   Components    │ │     Layouts     ││
│  │   Dashboard     │ │   BaseDrawer    │ │   AppLayout     ││
│  │   ProxyHosts    │ │   FormSection   │ │   DrawerLayout  ││
│  │   Certificates  │ │   TabPanel      │ │                 ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Logic Layer                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │     Hooks       │ │     Utils       │ │    Services     ││
│  │ useDrawerForm   │ │  Validation     │ │  ImportExport   ││
│  │ usePermissions  │ │  Formatting     │ │  Notification   ││
│  │ useFilteredData │ │  Helpers        │ │                 ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │      API        │ │     Stores      │ │     Types       ││
│  │  proxyHosts     │ │   authStore     │ │   interfaces    ││
│  │  certificates   │ │ uiSettingsStore │ │   enums         ││
│  │  accessLists    │ │                 │ │   schemas       ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Feature-based Architecture

The project is organized by features rather than technical layers, promoting **domain-driven development** and **team scalability**.

### Directory Structure

```
src/
├── components/
│   ├── base/                    # Foundation components
│   │   ├── BaseDrawer.tsx
│   │   ├── BaseDialog.tsx
│   │   └── README.md
│   ├── shared/                  # Reusable components
│   │   ├── FormSection.tsx
│   │   ├── TabPanel.tsx
│   │   ├── ArrayFieldManager.tsx
│   │   └── index.ts
│   └── features/                # Feature-specific components
│       ├── proxy-hosts/
│       │   ├── ProxyHostDrawer.tsx
│       │   ├── components/
│       │   │   ├── SSLConfigForm.tsx
│       │   │   ├── AdvancedConfigEditor.tsx
│       │   │   └── index.ts
│       │   ├── hooks/
│       │   │   ├── useProxyHostForm.ts
│       │   │   └── useSSLValidation.ts
│       │   ├── types/
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── certificates/
│       │   ├── CertificateDrawer.tsx
│       │   ├── components/
│       │   │   ├── DNSProviderSelector.tsx
│       │   │   ├── FileDropzone.tsx
│       │   │   └── index.ts
│       │   ├── hooks/
│       │   │   └── useCertificateForm.ts
│       │   └── index.ts
│       ├── access-lists/
│       │   ├── AccessListDrawer.tsx
│       │   ├── components/
│       │   └── index.ts
│       ├── dead-hosts/
│       ├── streams/
│       ├── users/
│       └── index.ts
├── hooks/                       # Global hooks
│   ├── useDrawerForm.ts
│   ├── usePermissions.ts
│   ├── useFilteredData.ts
│   └── index.ts
├── api/                         # API layer
│   ├── client.ts               # Base API client
│   ├── proxyHosts.ts
│   ├── certificates.ts
│   ├── accessLists.ts
│   └── index.ts
├── stores/                      # Global state
│   ├── authStore.ts
│   ├── uiSettingsStore.ts
│   └── index.ts
├── types/                       # Global types
│   ├── common.ts
│   ├── permissions.ts
│   ├── api.ts
│   └── index.ts
├── utils/                       # Utility functions
│   ├── validation.ts
│   ├── formatting.ts
│   ├── permissions.ts
│   └── index.ts
└── pages/                       # Top-level pages
    ├── Dashboard.tsx
    ├── ProxyHosts.tsx
    ├── Certificates.tsx
    └── index.ts
```

### Feature Module Pattern

Each feature follows a consistent structure:

```tsx
// Feature module example: proxy-hosts
export interface ProxyHostFeature {
  // Components
  ProxyHostDrawer: React.FC<ProxyHostDrawerProps>
  ProxyHostDetailsDialog: React.FC<ProxyHostDetailsDialogProps>
  
  // Hooks
  useProxyHostForm: (config: ProxyHostFormConfig) => ProxyHostFormState
  useSSLValidation: (host: ProxyHost) => ValidationResult
  
  // Types
  ProxyHost: Interface
  ProxyHostFormData: Interface
  
  // API
  proxyHostsApi: ApiClient<ProxyHost>
}

// Feature index.ts
export { ProxyHostDrawer } from './ProxyHostDrawer'
export { ProxyHostDetailsDialog } from './ProxyHostDetailsDialog'
export { useProxyHostForm } from './hooks/useProxyHostForm'
export { useSSLValidation } from './hooks/useSSLValidation'
export type * from './types'
```

### Benefits of Feature-based Architecture

1. **Team Scalability**: Multiple teams can work on different features
2. **Clear Boundaries**: Reduces coupling between features
3. **Easier Testing**: Feature-specific test suites
4. **Simpler Navigation**: Easy to locate feature-related code
5. **Better Reusability**: Shared components in dedicated folders

---

## Component Hierarchy

### Base Component Layer

```tsx
/**
 * BaseDrawer - Foundation for all drawer components
 * Provides: Layout, Tabs, Loading, Validation, Accessibility
 */
interface BaseDrawerProps {
  // Core functionality that all drawers need
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  
  // Advanced features
  tabs?: Tab[]
  loading?: boolean
  error?: string
  isDirty?: boolean
  
  // Behavior customization
  width?: number
  confirmClose?: boolean
  actions?: ReactNode
}

/**
 * BaseDialog - Foundation for modal dialogs
 * Provides: Modal behavior, Responsive design, Confirmation
 */
interface BaseDialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  actions?: ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}
```

### Shared Component Layer

```tsx
/**
 * FormSection - Organizes form content into sections
 * Features: Collapsible, Validation states, Error counting
 */
interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
  collapsible?: boolean
  error?: boolean
  errorCount?: number
  severity?: 'info' | 'warning' | 'error' | 'success'
}

/**
 * TabPanel - Tab content with animations
 * Features: Multiple animations, Lazy loading, Accessibility
 */
interface TabPanelProps {
  value: number
  index: number
  children: ReactNode
  animation?: 'fade' | 'slide' | 'grow' | 'none'
  keepMounted?: boolean
}

/**
 * ArrayFieldManager - Dynamic array field management
 * Features: Add/remove items, Validation, Reordering
 */
interface ArrayFieldManagerProps<T> {
  value: T[]
  onChange: (items: T[]) => void
  renderItem: (item: T, index: number) => ReactNode
  maxItems?: number
  minItems?: number
}
```

### Feature Component Layer

```tsx
/**
 * Feature-specific components extend base functionality
 * Example: ProxyHostDrawer extends BaseDrawer
 */
const ProxyHostDrawer: React.FC<ProxyHostDrawerProps> = (props) => {
  const form = useDrawerForm<ProxyHostFormData>({...})
  
  return (
    <BaseDrawer
      title="Edit Proxy Host"
      tabs={[
        { id: 'details', label: 'Details' },
        { id: 'ssl', label: 'SSL' },
        { id: 'advanced', label: 'Advanced' }
      ]}
      isDirty={form.isDirty}
      loading={form.loading}
      onSave={form.handleSubmit}
    >
      <TabPanel value={activeTab} index={0}>
        <FormSection title="Basic Settings" required>
          {/* Form fields */}
        </FormSection>
      </TabPanel>
      {/* More tabs */}
    </BaseDrawer>
  )
}
```

### Component Composition Pattern

```tsx
// Components are designed for composition
const ProxyHostManagementPage = () => (
  <PageLayout>
    <PageHeader title="Proxy Hosts" />
    <DataTable
      data={proxyHosts}
      columns={columns}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
    <ProxyHostDrawer
      open={drawerOpen}
      proxyHost={selectedHost}
      onClose={handleClose}
      onSave={handleSave}
    />
    <ConfirmDialog
      open={confirmOpen}
      title="Delete Proxy Host"
      message="Are you sure?"
      onConfirm={handleConfirmDelete}
      onCancel={handleCancelDelete}
    />
  </PageLayout>
)
```

---

## State Management Patterns

### Local State with Hooks

```tsx
/**
 * useDrawerForm - Advanced form state management
 * Handles: Validation, Auto-save, Dirty tracking, Field binding
 */
const useDrawerForm = <T extends Record<string, any>>(
  options: UseDrawerFormOptions<T>
) => {
  const [formState, setFormState] = useState<FormState<T>>({
    data: options.initialData,
    errors: {},
    loading: false,
    isDirty: false,
    touched: {},
    isValid: true,
    autoSaveStatus: 'idle'
  })
  
  // Form management logic
  return {
    ...formState,
    setFieldValue,
    getFieldProps,
    handleSubmit,
    resetForm
  }
}

/**
 * Usage pattern - Local state for component-specific data
 */
const ProxyHostDrawer = () => {
  // Form state (local)
  const form = useDrawerForm<ProxyHostFormData>({...})
  
  // UI state (local)
  const [activeTab, setActiveTab] = useState(0)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  
  // Global state (via context/store)
  const { user } = useAuth()
  const { theme } = useTheme()
}
```

### Global State with Context

```tsx
/**
 * Authentication State - Global context
 */
interface AuthContextValue {
  user: User | null
  permissions: Permission[]
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

/**
 * UI Settings State - Zustand store
 */
interface UISettingsStore {
  theme: 'light' | 'dark' | 'auto'
  sidebarOpen: boolean
  compactMode: boolean
  
  setTheme: (theme: UISettingsStore['theme']) => void
  toggleSidebar: () => void
  toggleCompactMode: () => void
}

export const useUISettings = create<UISettingsStore>((set) => ({
  theme: 'auto',
  sidebarOpen: true,
  compactMode: false,
  
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleCompactMode: () => set((state) => ({ compactMode: !state.compactMode }))
}))
```

### Server State with React Query

```tsx
/**
 * Server state management pattern
 */
const useProxyHosts = () => {
  return useQuery({
    queryKey: ['proxyHosts'],
    queryFn: proxyHostsApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  })
}

const useCreateProxyHost = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: proxyHostsApi.create,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries(['proxyHosts'])
      
      // Show success notification
      toast.success('Proxy host created successfully')
    },
    onError: (error) => {
      // Handle error
      toast.error(error.message)
    }
  })
}

/**
 * Usage in components
 */
const ProxyHostsPage = () => {
  const { data: proxyHosts, isLoading, error } = useProxyHosts()
  const createMutation = useCreateProxyHost()
  
  const handleCreate = async (data: CreateProxyHostData) => {
    await createMutation.mutateAsync(data)
  }
  
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  
  return <ProxyHostsList data={proxyHosts} onCreate={handleCreate} />
}
```

---

## Data Flow Architecture

### Unidirectional Data Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    User     │───▶│    Event    │───▶│   Action    │
│ Interaction │    │  Handler    │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
                                              ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│     UI      │◀───│    State    │◀───│   Update    │
│   Update    │    │   Change    │    │   Logic     │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Form Data Flow

```tsx
/**
 * Form data flows through a well-defined pipeline
 */

// 1. Initial Data → Form State
const form = useDrawerForm({
  initialData: proxyHost || getDefaultProxyHost(),
  // ...
})

// 2. User Input → Field Update → Validation
const handleFieldChange = (field: string, value: any) => {
  form.setFieldValue(field, value)  // Updates form.data
  // Triggers validation automatically
  // Updates form.errors, form.isValid, form.isDirty
}

// 3. Auto-save Flow
useEffect(() => {
  if (form.isDirty && form.isValid && autoSaveEnabled) {
    const timer = setTimeout(() => {
      autoSaveApi.save(form.data)
    }, 2000)
    return () => clearTimeout(timer)
  }
}, [form.data, form.isDirty, form.isValid])

// 4. Submit Flow
const handleSubmit = async () => {
  if (!form.isValid) {
    form.validateAllFields()
    return
  }
  
  try {
    await proxyHostsApi.update(form.data)
    onSuccess()
  } catch (error) {
    form.setGlobalError(error.message)
  }
}
```

### API Data Flow

```tsx
/**
 * API requests follow a consistent pattern
 */

// 1. API Client Layer
const proxyHostsApi = {
  async getAll(): Promise<ProxyHost[]> {
    const response = await api.get('/nginx/proxy-hosts')
    return response.data
  },
  
  async create(data: CreateProxyHostData): Promise<ProxyHost> {
    const response = await api.post('/nginx/proxy-hosts', data)
    return response.data
  }
}

// 2. React Query Layer
const useProxyHosts = () => {
  return useQuery({
    queryKey: ['proxyHosts'],
    queryFn: proxyHostsApi.getAll,
    select: (data) => data.sort((a, b) => a.domain_names[0].localeCompare(b.domain_names[0]))
  })
}

// 3. Component Layer
const ProxyHostsPage = () => {
  const { data, isLoading, error, refetch } = useProxyHosts()
  
  return (
    <DataTable
      data={data}
      loading={isLoading}
      error={error}
      onRefresh={refetch}
    />
  )
}
```

---

## Performance Optimization Patterns

### Component Optimization

```tsx
/**
 * Memoization patterns for components
 */

// 1. React.memo for stable props
const ProxyHostRow = React.memo(({ proxyHost, onEdit, onDelete }) => {
  return (
    <TableRow>
      <TableCell>{proxyHost.domain_names.join(', ')}</TableCell>
      <TableCell>{proxyHost.forward_host}</TableCell>
      <TableCell>
        <IconButton onClick={() => onEdit(proxyHost)}>
          <EditIcon />
        </IconButton>
        <IconButton onClick={() => onDelete(proxyHost.id)}>
          <DeleteIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for complex objects
  return (
    prevProps.proxyHost.id === nextProps.proxyHost.id &&
    prevProps.proxyHost.modified_on === nextProps.proxyHost.modified_on
  )
})

// 2. useMemo for expensive calculations
const memoizedFilteredHosts = useMemo(() => {
  return proxyHosts.filter(host => 
    host.domain_names.some(domain => 
      domain.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )
}, [proxyHosts, searchTerm])

// 3. useCallback for stable function references
const handleHostEdit = useCallback((host: ProxyHost) => {
  setSelectedHost(host)
  setDrawerOpen(true)
}, [])
```

### Bundle Optimization

```tsx
/**
 * Code splitting strategies
 */

// 1. Route-based splitting
const ProxyHostsPage = lazy(() => import('./pages/ProxyHosts'))
const CertificatesPage = lazy(() => import('./pages/Certificates'))

// 2. Component-based splitting
const AdvancedConfigEditor = lazy(() => 
  import('./components/AdvancedConfigEditor')
)

// 3. Feature-based splitting with preloading
const ProxyHostDrawer = lazy(() => 
  import('./features/proxy-hosts/ProxyHostDrawer').then(module => {
    // Preload related components
    import('./features/proxy-hosts/components/SSLConfigForm')
    import('./features/proxy-hosts/components/AdvancedConfigEditor')
    
    return { default: module.ProxyHostDrawer }
  })
)

// 4. Progressive loading
const useProgressiveComponents = () => {
  const [loadAdvanced, setLoadAdvanced] = useState(false)
  
  useEffect(() => {
    // Load advanced components after initial render
    const timer = setTimeout(() => setLoadAdvanced(true), 1000)
    return () => clearTimeout(timer)
  }, [])
  
  return { loadAdvanced }
}
```

### Data Optimization

```tsx
/**
 * Data fetching and caching patterns
 */

// 1. Optimistic updates
const useUpdateProxyHost = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: proxyHostsApi.update,
    onMutate: async (updatedHost) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries(['proxyHosts'])
      
      // Optimistically update cache
      queryClient.setQueryData(['proxyHosts'], (oldData) => 
        oldData?.map(host => 
          host.id === updatedHost.id ? { ...host, ...updatedHost } : host
        )
      )
    }
  })
}

// 2. Background refetching
const useProxyHostsWithBackground = () => {
  return useQuery({
    queryKey: ['proxyHosts'],
    queryFn: proxyHostsApi.getAll,
    staleTime: 30 * 1000,        // 30 seconds
    cacheTime: 5 * 60 * 1000,    // 5 minutes
    refetchOnWindowFocus: true,   // Refetch when window gains focus
    refetchInterval: 60 * 1000    // Background refetch every minute
  })
}

// 3. Infinite scrolling for large datasets
const useInfiniteProxyHosts = () => {
  return useInfiniteQuery({
    queryKey: ['proxyHosts', 'infinite'],
    queryFn: ({ pageParam = 0 }) => 
      proxyHostsApi.getPage(pageParam, 20),
    getNextPageParam: (lastPage, allPages) => 
      lastPage.length === 20 ? allPages.length : undefined
  })
}
```

---

## Design Patterns Used

### Compound Component Pattern

```tsx
/**
 * BaseDrawer uses compound components for flexibility
 */
const BaseDrawer = {
  Root: DrawerRoot,
  Header: DrawerHeader,
  Content: DrawerContent,
  Footer: DrawerFooter,
  TabList: DrawerTabList,
  Tab: DrawerTab,
  TabPanel: DrawerTabPanel
}

// Usage
<BaseDrawer.Root open={open} onClose={onClose}>
  <BaseDrawer.Header title="Edit Proxy Host" />
  <BaseDrawer.TabList>
    <BaseDrawer.Tab>Details</BaseDrawer.Tab>
    <BaseDrawer.Tab>SSL</BaseDrawer.Tab>
  </BaseDrawer.TabList>
  <BaseDrawer.Content>
    <BaseDrawer.TabPanel index={0}>
      <DetailsForm />
    </BaseDrawer.TabPanel>
    <BaseDrawer.TabPanel index={1}>
      <SSLForm />
    </BaseDrawer.TabPanel>
  </BaseDrawer.Content>
  <BaseDrawer.Footer>
    <SaveButton />
    <CancelButton />
  </BaseDrawer.Footer>
</BaseDrawer.Root>
```

### Hook Pattern

```tsx
/**
 * Custom hooks encapsulate complex logic
 */

// 1. Form management hook
const useDrawerForm = <T>(options: FormOptions<T>) => {
  // Complex form state logic
  return { data, errors, setFieldValue, handleSubmit, ... }
}

// 2. Permission hook
const usePermissions = () => {
  const { user } = useAuth()
  return {
    canCreate: hasPermission(user, 'create'),
    canEdit: hasPermission(user, 'edit'),
    canDelete: hasPermission(user, 'delete')
  }
}

// 3. Feature-specific hooks
const useProxyHostManagement = () => {
  const query = useProxyHosts()
  const createMutation = useCreateProxyHost()
  const updateMutation = useUpdateProxyHost()
  const deleteMutation = useDeleteProxyHost()
  
  return {
    proxyHosts: query.data,
    loading: query.isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync
  }
}
```

### Provider Pattern

```tsx
/**
 * Context providers for dependency injection
 */

// 1. Feature provider
const ProxyHostProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedHost, setSelectedHost] = useState<ProxyHost | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  
  const value = {
    selectedHost,
    drawerOpen,
    openDrawer: (host: ProxyHost) => {
      setSelectedHost(host)
      setDrawerOpen(true)
    },
    closeDrawer: () => {
      setSelectedHost(null)
      setDrawerOpen(false)
    }
  }
  
  return (
    <ProxyHostContext.Provider value={value}>
      {children}
    </ProxyHostContext.Provider>
  )
}

// 2. API provider
const APIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000
      }
    }
  })
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### Factory Pattern

```tsx
/**
 * Factory functions for creating configured instances
 */

// 1. API client factory
const createApiClient = <T, CreateT = Omit<T, 'id' | 'created_on' | 'modified_on'>>(
  endpoint: string
) => {
  return {
    async getAll(): Promise<T[]> {
      const response = await api.get(endpoint)
      return response.data
    },
    async create(data: CreateT): Promise<T> {
      const response = await api.post(endpoint, data)
      return response.data
    },
    // ... other methods
  }
}

// Usage
const proxyHostsApi = createApiClient<ProxyHost>('/nginx/proxy-hosts')
const certificatesApi = createApiClient<Certificate>('/nginx/certificates')

// 2. Form hook factory
const createFormHook = <T>(defaultConfig: Partial<UseDrawerFormOptions<T>>) => {
  return (config: UseDrawerFormOptions<T>) => {
    return useDrawerForm({
      ...defaultConfig,
      ...config
    })
  }
}

// Usage
const useProxyHostForm = createFormHook<ProxyHostFormData>({
  autoSave: { enabled: true, delay: 2000 }
})
```

---

## Scalability Considerations

### Code Organization

```tsx
/**
 * Scalable folder structure
 */

// 1. Feature modules are self-contained
features/
├── proxy-hosts/
│   ├── __tests__/              # Feature-specific tests
│   ├── components/             # Feature components
│   ├── hooks/                  # Feature hooks
│   ├── types/                  # Feature types
│   ├── utils/                  # Feature utilities
│   └── index.ts               # Feature exports
├── certificates/
└── access-lists/

// 2. Shared code is centralized
shared/
├── components/                 # Reusable UI components
├── hooks/                      # Reusable logic hooks
├── utils/                      # Utility functions
├── types/                      # Common types
└── constants/                  # Application constants
```

### Team Scalability

```tsx
/**
 * Clear ownership boundaries
 */

// 1. Feature teams own complete feature modules
const TEAM_OWNERSHIP = {
  'features/proxy-hosts': 'team-nginx',
  'features/certificates': 'team-security',
  'features/access-lists': 'team-auth',
  'shared/components/base': 'team-platform',
  'shared/components/forms': 'team-platform'
}

// 2. Clear interfaces between teams
export interface ProxyHostFeatureAPI {
  components: {
    ProxyHostDrawer: React.FC<ProxyHostDrawerProps>
    ProxyHostList: React.FC<ProxyHostListProps>
  }
  
  hooks: {
    useProxyHosts: () => UseQueryResult<ProxyHost[]>
    useProxyHostForm: (config: FormConfig) => FormState
  }
  
  types: {
    ProxyHost: TypeDefinition
    ProxyHostFormData: TypeDefinition
  }
}
```

### Performance Scalability

```tsx
/**
 * Performance patterns for large datasets
 */

// 1. Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window'

const VirtualizedProxyHostList = ({ hosts }) => (
  <List
    height={600}
    itemCount={hosts.length}
    itemSize={80}
    itemData={hosts}
  >
    {ProxyHostRow}
  </List>
)

// 2. Pagination for server-side performance
const useProxyHostsPaginated = (pageSize = 50) => {
  return useInfiniteQuery({
    queryKey: ['proxyHosts', 'paginated'],
    queryFn: ({ pageParam = 0 }) => 
      proxyHostsApi.getPage(pageParam, pageSize),
    getNextPageParam: (lastPage, allPages) => 
      lastPage.length === pageSize ? allPages.length : undefined
  })
}

// 3. Background sync for offline support
const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingChanges, setPendingChanges] = useState([])
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Sync pending changes
      syncPendingChanges(pendingChanges)
    }
    
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [pendingChanges])
  
  return { isOnline, pendingChanges }
}
```

### API Scalability

```tsx
/**
 * API patterns for scalability
 */

// 1. Resource-based API structure
const apiEndpoints = {
  proxyHosts: '/api/v1/nginx/proxy-hosts',
  certificates: '/api/v1/nginx/certificates',
  accessLists: '/api/v1/nginx/access-lists',
  users: '/api/v1/users',
  settings: '/api/v1/settings'
}

// 2. Consistent API client pattern
const createResourceAPI = <T>(endpoint: string) => {
  return {
    list: (params?: ListParams) => api.get<T[]>(endpoint, { params }),
    get: (id: number) => api.get<T>(`${endpoint}/${id}`),
    create: (data: CreateData<T>) => api.post<T>(endpoint, data),
    update: (id: number, data: UpdateData<T>) => api.put<T>(`${endpoint}/${id}`, data),
    delete: (id: number) => api.delete(`${endpoint}/${id}`)
  }
}

// 3. Caching strategy for performance
const cacheConfig = {
  proxyHosts: { staleTime: 30000, cacheTime: 300000 },    // 30s stale, 5m cache
  certificates: { staleTime: 60000, cacheTime: 600000 },  // 1m stale, 10m cache
  settings: { staleTime: 300000, cacheTime: 1800000 }     // 5m stale, 30m cache
}
```

This architecture documentation provides a comprehensive overview of the design patterns, organizational structure, and scalability considerations of the NPMDeck refactored system. The architecture supports maintainable, performant, and scalable development while providing excellent user experience.