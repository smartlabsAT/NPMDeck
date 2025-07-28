# NPMDeck Base Components

This directory contains the reusable base components extracted from the original NPMDeck drawer and dialog implementations. These components provide a consistent foundation for all UI elements across the application.

## Components Overview

### 🔧 BaseDrawer.tsx
A comprehensive drawer component for forms and content with advanced features:

**Features:**
- Responsive width adaptation (mobile, tablet, desktop)
- Tab support with icons, badges, and disabled states
- Loading states with overlay and custom messages
- Error handling and display
- Customizable actions and submit buttons
- Close confirmation for dirty forms
- Smooth animations and transitions
- Accessibility support (ARIA attributes, keyboard navigation)
- Sticky header and footer for long content

**Usage:**
```tsx
<BaseDrawer
  open={open}
  onClose={handleClose}
  title="Edit User"
  subtitle="Modify user settings and permissions"
  tabs={[
    { label: 'Details', icon: <PersonIcon /> },
    { label: 'Permissions', icon: <ShieldIcon /> }
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  onSubmit={handleSubmit}
  loading={loading}
  error={error}
  isDirty={isDirty}
  maxWidth="lg"
>
  <TabContent />
</BaseDrawer>
```

### 🔧 BaseDialog.tsx
A versatile dialog component for confirmations, forms, and content display:

**Features:**
- Multiple severity levels (info, warning, error, success)
- Responsive sizing with full-screen mobile support
- Loading states with overlay
- Error and success message handling
- Customizable actions and callbacks
- Smooth animations and transitions
- Accessibility support
- Persistent mode for critical dialogs
- Convenience components (ConfirmDialog, ErrorDialog, InfoDialog)

**Usage:**
```tsx
// Confirmation Dialog
<BaseDialog
  open={open}
  onClose={handleClose}
  title="Delete User"
  message="Are you sure you want to delete this user?"
  severity="error"
  confirmText="Delete"
  confirmColor="error"
  onConfirm={handleDelete}
  loading={deleting}
/>

// Form Dialog
<BaseDialog
  open={open}
  onClose={handleClose}
  title="Create Certificate"
  maxWidth="md"
  fullWidth
  showActions
  confirmText="Create"
  onConfirm={handleCreate}
>
  <CertificateForm />
</BaseDialog>
```

## Shared Components

### 📝 FormSection.tsx
Organizes form content into collapsible, themed sections:

**Features:**
- Collapsible content with smooth animations
- Multiple severity levels with appropriate styling
- Error state handling with error counts
- Loading states and disabled interactions
- Customizable headers with icons and badges
- Accessibility support
- Required field indicators

**Usage:**
```tsx
<FormSection
  title="SSL Configuration"
  description="Configure SSL certificates and security"
  icon={<LockIcon />}
  severity="warning"
  collapsible
  errorCount={sslErrors}
  required
>
  <SSLConfigForm />
</FormSection>
```

### 📑 TabPanel.tsx
Handles tab content with configurable transitions:

**Features:**
- Multiple animation types (fade, slide, grow, collapse)
- Configurable animation timing
- Accessibility support with ARIA attributes
- Loading states with placeholders
- Keep mounted option for performance
- Custom transition components
- Lazy loading support

**Usage:**
```tsx
<TabPanel
  value={activeTab}
  index={0}
  animation="fade"
  timeout={300}
  keepMounted
>
  <TabContent />
</TabPanel>
```

### 🔢 ArrayFieldManager.tsx
Comprehensive component for managing array fields:

**Features:**
- Add, remove, and reorder items
- Item validation with error display
- Drag and drop reordering (configurable)
- Copy/duplicate items
- Autocomplete suggestions
- Custom item components
- Empty state handling
- Min/max item limits
- Accessibility support

**Usage:**
```tsx
<ArrayFieldManager
  value={domains}
  onChange={setDomains}
  label="Domain Names"
  defaultValue=""
  maxItems={10}
  required
  validateItem={(domain) => {
    if (!domain) return 'Domain name is required'
    if (!/^[a-zA-Z0-9.-]+$/.test(domain)) return 'Invalid domain format'
    return null
  }}
  allowCopy
  draggable
/>
```

## Hooks

### 🎣 useDrawerForm.ts
Advanced form management hook with comprehensive features:

**Features:**
- Type-safe form state management
- Global and field-level validation
- Auto-save functionality with debouncing
- Dirty state tracking with custom equality functions
- Touch state management
- Debounced validation
- Error handling and display
- Easy field binding with getFieldProps
- Form submission handling
- Auto-reset options

**Usage:**
```tsx
interface UserForm {
  name: string
  email: string
  role: string
  active: boolean
}

const {
  values,
  setValue,
  loading,
  error,
  errors,
  handleSubmit,
  isDirty,
  isValid,
  getFieldProps
} = useDrawerForm<UserForm>({
  initialValues: {
    name: '',
    email: '',
    role: 'user',
    active: true
  },
  validate: (values) => {
    const errors: Record<string, string> = {}
    if (!values.name) errors.name = 'Name is required'
    if (!values.email) errors.email = 'Email is required'
    return Object.keys(errors).length > 0 ? errors : null
  },
  onSubmit: async (values) => {
    await api.createUser(values)
  },
  onSuccess: () => {
    showToast('User created successfully')
    onClose()
  },
  autoSave: true,
  validateOnChange: true
})

// Easy field binding
<TextField
  label="Name"
  {...getFieldProps('name')}
/>
```

## Design Principles

### 🎨 Consistent Styling
- Material-UI theme integration
- Responsive design patterns
- Consistent spacing and typography
- Proper color usage for states (error, warning, success)

### ♿ Accessibility First
- ARIA attributes and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast compliance

### 🚀 Performance Optimized
- Lazy loading where appropriate
- Efficient re-rendering patterns
- Memory leak prevention
- Proper cleanup in useEffect hooks

### 🔧 Developer Experience
- Comprehensive TypeScript interfaces
- Extensive JSDoc documentation
- Clear prop naming conventions
- Helpful error messages
- Easy-to-use APIs

## Migration Guide

### From Legacy Components

1. **Replace drawer usage:**
   ```tsx
   // Before
   <AdaptiveContainer
     open={open}
     onClose={onClose}
     entity="proxy_hosts"
     operation="create"
     title="New Proxy Host"
   >
     <Content />
   </AdaptiveContainer>
   
   // After
   <BaseDrawer
     open={open}
     onClose={onClose}
     title="New Proxy Host"
     onSubmit={handleSubmit}
     loading={loading}
     error={error}
   >
     <Content />
   </BaseDrawer>
   ```

2. **Replace dialog usage:**
   ```tsx
   // Before
   <Dialog open={open} onClose={onClose}>
     <DialogTitle>Confirm</DialogTitle>
     <DialogContent>Are you sure?</DialogContent>
     <DialogActions>
       <Button onClick={onClose}>Cancel</Button>
       <Button onClick={onConfirm}>Confirm</Button>
     </DialogActions>
   </Dialog>
   
   // After
   <ConfirmDialog
     open={open}
     onClose={onClose}
     title="Confirm"
     message="Are you sure?"
     onConfirm={onConfirm}
   />
   ```

3. **Replace form hooks:**
   ```tsx
   // Before: Manual state management
   const [values, setValues] = useState(initialValues)
   const [loading, setLoading] = useState(false)
   const [errors, setErrors] = useState({})
   
   // After: Comprehensive hook
   const {
     values,
     setValue,
     loading,
     errors,
     handleSubmit,
     getFieldProps
   } = useDrawerForm({
     initialValues,
     onSubmit,
     validate
   })
   ```

## Best Practices

1. **Component Composition**: Use base components as building blocks for domain-specific components
2. **Prop Consistency**: Follow established prop naming patterns across components
3. **Error Handling**: Always provide meaningful error messages and loading states
4. **Accessibility**: Include proper ARIA attributes and keyboard support
5. **Performance**: Use keepMounted sparingly and implement proper cleanup
6. **Testing**: Test components with various prop combinations and edge cases

## Integration Examples

See the `/examples` directory for complete integration examples showing how to combine these base components into complex UI patterns.

## Contributing

When extending these base components:

1. Maintain backward compatibility
2. Add comprehensive TypeScript types
3. Include JSDoc documentation
4. Follow existing code patterns
5. Add unit tests for new features
6. Update this README with new capabilities

## Related Files

- `/src/components/base/` - Base component implementations
- `/src/components/shared/` - Shared utility components  
- `/src/hooks/` - Reusable hooks
- `/src/types/` - TypeScript interface definitions
- `/examples/` - Usage examples and patterns