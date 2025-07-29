# Component API Documentation

This document provides comprehensive API documentation for the refactored drawer system components in NPMDeck.

## Table of Contents

1. [BaseDrawer Component](#basedrawer-component)
2. [useDrawerForm Hook](#usedrawerform-hook)
3. [FormSection Component](#formsection-component)
4. [TabPanel Component](#tabpanel-component)
5. [Shared Components](#shared-components)
6. [Feature-specific Components](#feature-specific-components)

---

## BaseDrawer Component

The `BaseDrawer` is the foundation component for all drawer-based forms in NPMDeck. It provides a consistent interface with responsive design, tab support, loading states, and accessibility features.

### Import

```tsx
import { BaseDrawer } from '@/components/base/BaseDrawer'
```

### Props Interface

```tsx
interface BaseDrawerProps {
  // Core Properties
  open: boolean                    // Whether the drawer is open
  onClose: () => void             // Function to call when drawer should close
  title: string                   // Title displayed in the drawer header
  subtitle?: string               // Optional subtitle
  children: ReactNode             // Content to display in the drawer
  
  // State Management
  loading?: boolean               // Loading state
  loadingMessage?: string         // Custom loading message
  error?: string                  // Error message to display
  success?: string                // Success message to display
  isDirty?: boolean              // Whether the form has unsaved changes
  
  // Tab Configuration
  tabs?: Tab[]                   // Tabs configuration
  activeTab?: number             // Active tab index
  onTabChange?: (index: number) => void  // Tab change handler
  
  // Actions
  actions?: ReactNode            // Custom actions in footer
  onSave?: () => void           // Save handler
  onCancel?: () => void         // Cancel handler
  saveDisabled?: boolean        // Whether save is disabled
  saveText?: string             // Custom save button text
  cancelText?: string           // Custom cancel button text
  
  // Behavior
  confirmClose?: boolean        // Show close confirmation for dirty forms
  confirmCloseMessage?: string  // Custom confirmation message
  disableBackdropClick?: boolean // Disable backdrop click to close
  disableEscapeKeyDown?: boolean // Disable escape key to close
  
  // Styling
  width?: number | string       // Drawer width
  className?: string            // Additional CSS class
}
```

### Tab Interface

```tsx
interface Tab {
  id: string                    // Unique identifier
  label: string                 // Display label
  icon?: ReactNode             // Optional icon
  badge?: string | number      // Badge content
  badgeColor?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
  disabled?: boolean           // Whether tab is disabled
  hasError?: boolean          // Whether tab has validation errors
}
```

### Example Usage

```tsx
// Basic drawer
<BaseDrawer
  open={isOpen}
  onClose={handleClose}
  title="Edit Proxy Host"
  loading={isSubmitting}
  onSave={handleSave}
  isDirty={formIsDirty}
>
  <ProxyHostForm />
</BaseDrawer>

// Advanced drawer with tabs
<BaseDrawer
  open={isOpen}
  onClose={handleClose}
  title="SSL Configuration"
  subtitle="Configure certificates and security settings"
  tabs={[
    { id: 'details', label: 'Details', hasError: hasDetailsError },
    { id: 'ssl', label: 'SSL', badge: certificateCount, badgeColor: 'primary' },
    { id: 'advanced', label: 'Advanced', icon: <SettingsIcon /> }
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  width={800}
  confirmClose={true}
  error={submitError}
>
  {renderTabContent()}
</BaseDrawer>
```

### Features

- **Responsive Design**: Automatically adapts to mobile screens
- **Tab Support**: Multiple tabs with badges, icons, and error states
- **Loading States**: Built-in loading overlay with custom messages
- **Dirty State Tracking**: Warns users about unsaved changes
- **Accessibility**: Full ARIA support and keyboard navigation
- **Keyboard Shortcuts**: Ctrl+Tab for tab navigation, Escape to close
- **Close Confirmation**: Prevents accidental data loss

---

## useDrawerForm Hook

Advanced form state management hook that provides validation, auto-save, dirty tracking, and field binding.

### Import

```tsx
import { useDrawerForm } from '@/hooks/useDrawerForm'
```

### Configuration Interface

```tsx
interface UseDrawerFormOptions<T> {
  initialData: T                          // Initial form data
  fields?: Record<keyof T, FieldConfig>   // Field configurations
  validate?: (data: T) => Record<keyof T, string> | null  // Global validation
  onSubmit: (data: T) => Promise<void> | void             // Submit handler
  onSuccess?: (data: T) => void           // Success callback
  onError?: (error: Error) => void        // Error callback
  autoSave?: AutoSaveConfig               // Auto-save configuration
  isEqual?: (a: T, b: T) => boolean      // Custom equality function
  resetOnSubmit?: boolean                 // Reset form after submit
}

interface FieldConfig<T = any> {
  initialValue: T                    // Initial field value
  validate?: (value: T) => string | null  // Field validation
  required?: boolean                 // Whether field is required
  requiredMessage?: string           // Custom required message
  validateOnChange?: boolean         // Validate on change (default: true)
  validateOnBlur?: boolean          // Validate on blur (default: true)
}

interface AutoSaveConfig {
  enabled: boolean                   // Enable auto-save
  delay?: number                    // Delay in milliseconds (default: 2000)
  onAutoSave: (data: T) => Promise<void> | void  // Auto-save handler
}
```

### Return Interface

```tsx
interface FormState<T> {
  // Data
  data: T                           // Current form data
  errors: Partial<Record<keyof T, string>>  // Field errors
  globalError: string | null        // Global form error
  
  // State
  loading: boolean                  // Form is submitting
  isDirty: boolean                 // Form has been modified
  touched: Partial<Record<keyof T, boolean>>  // Touched fields
  isValid: boolean                 // Form is valid
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error'  // Auto-save status
  
  // Actions
  setFormData: (updates: Partial<T> | ((prev: T) => T)) => void
  setFieldValue: (key: keyof T, value: any) => void
  setFieldTouched: (key: keyof T, touched?: boolean) => void
  resetForm: (newInitialData?: T) => void
  handleSubmit: (event?: React.FormEvent) => Promise<void>
  
  // Helpers
  getFieldProps: (key: keyof T) => FieldProps
  validateField: (key: keyof T, value: any) => string | null
  validateAllFields: (data: T) => Record<keyof T, string>
}
```

### Field Props Interface

```tsx
interface FieldProps {
  name: string                      // Field name
  value: any                       // Field value
  onChange: (event: ChangeEvent) => void  // Change handler
  onBlur: () => void               // Blur handler
  error: boolean                   // Has error
  helperText?: string              // Error message
  disabled: boolean                // Is disabled
}
```

### Example Usage

```tsx
// Basic form
const form = useDrawerForm({
  initialData: { name: '', email: '' },
  fields: {
    name: { initialValue: '', required: true },
    email: { 
      initialValue: '', 
      required: true,
      validate: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(value) ? null : 'Invalid email address'
      }
    }
  },
  onSubmit: async (data) => {
    await api.saveUser(data)
  }
})

// In component
<TextField
  {...form.getFieldProps('name')}
  label="Name"
  required
/>

<TextField
  {...form.getFieldProps('email')}
  label="Email"
  type="email"
  required
/>

// Advanced form with auto-save
const form = useDrawerForm({
  initialData: proxyHost,
  fields: {
    domain_names: { 
      initialValue: [], 
      required: true,
      validate: (domains) => domains.length === 0 ? 'At least one domain is required' : null
    },
    forward_host: { initialValue: '', required: true },
    forward_port: { 
      initialValue: 80,
      validate: (port) => port >= 1 && port <= 65535 ? null : 'Port must be between 1-65535'
    }
  },
  validate: (data) => {
    // Global validation
    if (data.ssl_forced && !data.certificate_id) {
      return { certificate_id: 'Certificate required when SSL is forced' }
    }
    return null
  },
  onSubmit: async (data) => {
    await proxyHostsApi.update(data)
  },
  autoSave: {
    enabled: true,
    delay: 3000,
    onAutoSave: async (data) => {
      await proxyHostsApi.autosave(data)
    }
  }
})
```

### Features

- **Field-level Validation**: Individual field validation with custom messages
- **Global Validation**: Cross-field validation rules
- **Auto-save**: Automatic saving with debouncing
- **Dirty Tracking**: Tracks form modifications
- **Touch Management**: Tracks which fields have been interacted with
- **Easy Field Binding**: `getFieldProps()` provides all necessary props
- **Loading States**: Built-in submission loading state
- **Error Handling**: Comprehensive error management

---

## FormSection Component

Reusable component for organizing form content into collapsible sections with validation states.

### Import

```tsx
import FormSection, { ErrorFormSection, WarningFormSection } from '@/components/shared/FormSection'
```

### Props Interface

```tsx
interface FormSectionProps {
  // Content
  title: string                    // Section title
  description?: string             // Optional description
  icon?: ReactNode                // Optional icon
  children: ReactNode             // Section content
  
  // Behavior
  collapsible?: boolean           // Can be collapsed
  defaultExpanded?: boolean       // Default expanded state
  required?: boolean              // Is required section
  disabled?: boolean              // Is disabled
  
  // Validation
  severity?: 'info' | 'warning' | 'error' | 'success'  // Severity level
  error?: boolean                 // Has errors
  errorCount?: number             // Number of errors
  
  // State
  loading?: boolean               // Is loading
  
  // Styling
  sx?: any                       // Custom styles
  elevation?: number             // Paper elevation
  subtle?: boolean               // Subtle background
  
  // Header
  headerContent?: ReactNode      // Additional header content
  
  // Animation
  animated?: boolean             // Animate collapse/expand
  expandIcon?: ReactNode         // Custom expand icon
  collapseIcon?: ReactNode       // Custom collapse icon
  
  // Events
  onToggle?: (expanded: boolean) => void  // Toggle callback
}
```

### Example Usage

```tsx
// Basic section
<FormSection
  title="Basic Settings"
  description="Configure the fundamental settings"
  icon={<SettingsIcon />}
  required
>
  <TextField label="Domain Name" />
  <TextField label="Forward Host" />
</FormSection>

// Collapsible section with errors
<FormSection
  title="SSL Configuration"
  description="Configure SSL certificates"
  icon={<LockIcon />}
  collapsible
  defaultExpanded={false}
  error={hasSSLErrors}
  errorCount={sslErrorCount}
  severity="error"
>
  <SSLConfigForm />
</FormSection>

// Warning section
<WarningFormSection
  title="Advanced Settings"
  description="Advanced configuration options - use with caution"
  collapsible
  headerContent={<Chip label="Advanced" color="warning" size="small" />}
>
  <AdvancedConfigForm />
</WarningFormSection>
```

### Convenience Components

```tsx
// Pre-configured error section
<ErrorFormSection
  title="Validation Errors"
  errorCount={totalErrors}
  collapsible
>
  <ErrorList errors={formErrors} />
</ErrorFormSection>

// Pre-configured warning section
<WarningFormSection
  title="SSL Certificate Warning"
  description="Certificate will expire soon"
>
  <CertificateWarning />
</WarningFormSection>
```

### Features

- **Collapsible Content**: Smooth animations for expand/collapse
- **Validation States**: Error, warning, info, and success states
- **Error Counting**: Displays error counts with badges
- **Loading States**: Built-in loading indicators
- **Accessibility**: Full ARIA support and keyboard navigation
- **Customizable Headers**: Icons, badges, and additional content
- **Responsive Design**: Mobile-friendly layout

---

## TabPanel Component

Advanced tab panel component with multiple animation types and lazy loading support.

### Import

```tsx
import TabPanel, { FadeTabPanel, SlideTabPanel, LazyTabPanel } from '@/components/shared/TabPanel'
```

### Props Interface

```tsx
interface TabPanelProps {
  // Core
  children?: ReactNode            // Panel content
  index: number                   // Panel index
  value: number                   // Active tab value
  
  // Animation
  animation?: 'none' | 'fade' | 'slide' | 'grow' | 'collapse'  // Animation type
  timeout?: number                // Animation timeout
  slideDirection?: 'left' | 'right' | 'up' | 'down'  // Slide direction
  
  // Behavior
  keepMounted?: boolean           // Keep mounted when hidden
  loading?: boolean               // Is loading
  loadingComponent?: ReactNode    // Custom loading component
  
  // Styling
  sx?: any                       // Custom styles
  padding?: number | string      // Panel padding
  
  // Custom Transitions
  TransitionComponent?: React.ComponentType<TransitionProps>  // Custom transition
  transitionProps?: any          // Transition props
  
  // Accessibility
  role?: string                  // ARIA role
  'aria-labelledby'?: string     // ARIA labelledby
  ariaProps?: Record<string, any>  // Additional ARIA props
}
```

### Example Usage

```tsx
// Basic tab panel
<TabPanel
  value={activeTab}
  index={0}
  animation="fade"
  timeout={300}
>
  <BasicSettingsForm />
</TabPanel>

// Slide animation
<TabPanel
  value={activeTab}
  index={1}
  animation="slide"
  slideDirection="left"
  keepMounted
>
  <SSLConfigurationForm />
</TabPanel>

// Lazy loading
<LazyTabPanel
  value={activeTab}
  index={2}
  onFirstActivation={() => loadAdvancedSettings()}
>
  <AdvancedSettingsForm />
</LazyTabPanel>
```

### Convenience Components

```tsx
// Fade transition
<FadeTabPanel
  value={activeTab}
  index={0}
  fadeTimeout={500}
>
  <Content />
</FadeTabPanel>

// Slide transition
<SlideTabPanel
  value={activeTab}
  index={1}
  direction="right"
  slideTimeout={300}
>
  <Content />
</SlideTabPanel>

// No animation
<NoAnimationTabPanel
  value={activeTab}
  index={2}
>
  <Content />
</NoAnimationTabPanel>
```

### Features

- **Multiple Animations**: Fade, slide, grow, collapse, or none
- **Lazy Loading**: Only render content when first activated
- **Keep Mounted**: Option to keep content mounted for performance
- **Custom Transitions**: Support for custom transition components
- **Loading States**: Built-in loading placeholders
- **Accessibility**: Full ARIA support

---

## Shared Components

### ArrayFieldManager

Manages dynamic arrays of form fields with add/remove functionality.

```tsx
import { ArrayFieldManager } from '@/components/shared/ArrayFieldManager'

<ArrayFieldManager
  value={domains}
  onChange={setDomains}
  renderItem={(domain, index) => (
    <TextField
      value={domain}
      onChange={(e) => updateDomain(index, e.target.value)}
      label={`Domain ${index + 1}`}
    />
  )}
  addLabel="Add Domain"
  removeLabel="Remove"
  maxItems={10}
/>
```

### DomainInput

Specialized input component for domain name management.

```tsx
import DomainInput from '@/components/DomainInput'

<DomainInput
  value={domainNames}
  onChange={setDomainNames}
  label="Domain Names"
  placeholder="Enter domains"
  error={hasError}
  helperText="Enter one domain per line"
/>
```

---

## Feature-specific Components

### ProxyHostDrawer

```tsx
import { ProxyHostDrawer } from '@/components/features/proxy-hosts/ProxyHostDrawer'

<ProxyHostDrawer
  open={isOpen}
  onClose={handleClose}
  proxyHost={selectedHost}
  onSave={handleSave}
  certificates={availableCerts}
/>
```

### CertificateDrawer

```tsx
import { CertificateDrawer } from '@/components/features/certificates/CertificateDrawer'

<CertificateDrawer
  open={isOpen}
  onClose={handleClose}
  certificate={selectedCert}
  onSave={handleSave}
  dnsProviders={availableProviders}
/>
```

### AccessListDrawer

```tsx
import { AccessListDrawer } from '@/components/features/access-lists/AccessListDrawer'

<AccessListDrawer
  open={isOpen}
  onClose={handleClose}
  accessList={selectedList}
  onSave={handleSave}
/>
```

---

## TypeScript Integration

All components are fully typed with TypeScript for enhanced developer experience:

```tsx
// Type-safe form data
interface ProxyHostFormData {
  domain_names: string[]
  forward_scheme: 'http' | 'https'
  forward_host: string
  forward_port: number
  certificate_id?: number
  ssl_forced: boolean
  // ... other fields
}

// Type-safe form hook
const form = useDrawerForm<ProxyHostFormData>({
  initialData: {
    domain_names: [],
    forward_scheme: 'http',
    forward_host: '',
    forward_port: 80,
    ssl_forced: false
  },
  // ... configuration
})

// Type-safe tabs
const tabs: Tab[] = [
  { id: 'details', label: 'Details' },
  { id: 'ssl', label: 'SSL' },
  { id: 'advanced', label: 'Advanced' }
]
```

---

## Performance Considerations

- **Lazy Loading**: Use `LazyTabPanel` for heavy content
- **Keep Mounted**: Use `keepMounted` for frequently accessed tabs
- **Auto-save Debouncing**: Configure appropriate delays
- **Validation Optimization**: Use field-level validation when possible
- **Memory Management**: Components automatically clean up resources

---

## Accessibility Features

- **ARIA Labels**: All components include proper ARIA attributes
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Semantic HTML and labels
- **Focus Management**: Proper focus handling
- **High Contrast**: Supports high contrast themes
- **Color Blind Friendly**: Uses patterns and text in addition to colors

This documentation provides a comprehensive guide to using the refactored drawer system components. For implementation examples, see the Developer Guide and Migration Guide.