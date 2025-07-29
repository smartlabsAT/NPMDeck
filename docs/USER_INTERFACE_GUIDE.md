# User Interface Guide - NPMDeck Refactored System

This guide provides comprehensive information for end users about the updated NPMDeck interface, focusing on the new drawer system and enhanced user experience features.

## Table of Contents

1. [Interface Overview](#interface-overview)
2. [Navigation and Layout](#navigation-and-layout)
3. [Working with Drawers](#working-with-drawers)
4. [Auto-Save Feature](#auto-save-feature)
5. [Form Validation and Error Handling](#form-validation-and-error-handling)
6. [Accessibility Features](#accessibility-features)
7. [Mobile Usage](#mobile-usage)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Tips and Best Practices](#tips-and-best-practices)

---

## Interface Overview

The NPMDeck interface has been redesigned with a focus on **usability**, **consistency**, and **accessibility**. The new system provides:

- **Unified Drawer System**: Consistent interface for all configuration forms
- **Real-time Validation**: Immediate feedback on form inputs
- **Auto-save**: Automatic saving of changes to prevent data loss
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Accessibility**: Full screen reader support and keyboard navigation

### Key Interface Elements

```
┌─────────────────────────────────────────────────────────────┐
│                        Header Bar                           │
│  Logo    Navigation Menu    User Profile    Theme Toggle    │
├─────────────────────────────────────────────────────────────┤
│                                                      │      │
│                Main Content Area                     │      │
│  ┌─────────────────────────────────────────┐        │      │
│  │            Data Table                   │        │ Side │
│  │  Domain Name    Forward Host    Actions │        │ Panel│
│  │  example.com    localhost:3000  [Edit]  │        │      │
│  │  test.local     192.168.1.100   [Edit]  │        │      │
│  │  site.org       backend.local    [Edit]  │        │      │
│  └─────────────────────────────────────────┘        │      │
│                                                      │      │
└──────────────────────────────────────────────────────┴──────┘

                        ┌─────────────────────────┐
                        │                         │
                        │      Form Drawer        │
                        │                         │
                        │  ┌─ Details ─┐ ┌─ SSL ─┐│
                        │  │           │ │       ││
                        │  │ Form      │ │       ││
                        │  │ Fields    │ │       ││
                        │  │           │ │       ││
                        │  └───────────┘ └───────┘│
                        │                         │
                        │    [Cancel] [Save]      │
                        └─────────────────────────┘
```

---

## Navigation and Layout

### Main Navigation

The primary navigation is organized by resource type:

- **Dashboard**: Overview and system statistics
- **Proxy Hosts**: HTTP/HTTPS proxy configuration
- **Redirection Hosts**: URL redirections
- **Dead Hosts**: Disabled or non-functional hosts
- **Streams**: TCP/UDP stream forwarding
- **SSL Certificates**: Certificate management
- **Access Lists**: Authentication and access control
- **Users**: User account management
- **Settings**: System configuration

### Breadcrumb Navigation

When working within a specific resource, breadcrumbs show your current location:

```
Home > Proxy Hosts > Edit "example.com"
```

### Search and Filtering

Each resource page includes:
- **Global Search**: Search across all fields
- **Column Filters**: Filter by specific attributes
- **Quick Filters**: Common filter combinations
- **Sort Options**: Sort by any column

---

## Working with Drawers

### Opening Drawers

Drawers can be opened through several actions:
- **Add Button**: Create new resources
- **Edit Button**: Modify existing resources
- **Row Double-click**: Quick edit access
- **Keyboard Shortcut**: `Ctrl+N` for new, `Enter` for edit

### Drawer Components

#### Header Section
```
┌─────────────────────────────────────────────────┐
│ Edit Proxy Host                            [✕]  │
│ Configure domain forwarding and SSL             │
└─────────────────────────────────────────────────┘
```

The header displays:
- **Title**: Action and resource type
- **Subtitle**: Brief description (when applicable)
- **Close Button**: Close without saving (with confirmation if changes exist)

#### Tab Navigation
```
┌─────────────────────────────────────────────────┐
│ [ Details ] [ SSL Certificate ] [ Advanced ]    │
└─────────────────────────────────────────────────┘
```

Tabs organize related settings:
- **Visual Indicators**: Error states show warning icons
- **Badge Numbers**: Show counts (e.g., number of domains)
- **Disabled States**: Some tabs may be disabled based on selections

#### Form Sections
```
┌─────────────────────────────────────────────────┐
│ 📋 Basic Settings                          [−]  │
│ ───────────────────────────────────────────────  │
│ Configure fundamental proxy settings             │
│                                                 │
│ Domain Names *                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ example.com                              │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Forward Host *                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ localhost                                   │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

Form sections feature:
- **Collapsible Design**: Click header to expand/collapse
- **Icons**: Visual indicators for section type
- **Required Indicators**: Asterisks (*) for required fields
- **Error Counts**: Number badges for validation errors

#### Footer Actions
```
┌─────────────────────────────────────────────────┐
│                           [Cancel] [Save]       │
└─────────────────────────────────────────────────┘
```

Footer includes:
- **Cancel Button**: Discard changes and close
- **Save Button**: Apply changes and continue editing
- **Auto-save Status**: Indicator when auto-save is active

### Working with Tabs

#### Tab Navigation Methods

1. **Mouse**: Click tab headers to switch
2. **Keyboard**: Use `Ctrl+Tab` to move forward, `Ctrl+Shift+Tab` to move backward
3. **Touch**: Swipe left/right on mobile devices

#### Tab States

- **Active**: Currently selected tab (highlighted)
- **Error**: Tab contains validation errors (red indicator)
- **Warning**: Tab has warnings or recommendations (yellow indicator)
- **Disabled**: Tab not accessible due to dependencies (grayed out)

### Form Sections

#### Collapsible Sections

All form sections can be collapsed to save space:

1. **Click Section Header**: Toggle expand/collapse
2. **Keyboard**: Use `Space` or `Enter` when focused
3. **Mobile**: Tap section header

#### Section Types

**Basic Sections**: Standard configuration options
```
📋 Basic Settings
Configure fundamental settings for your proxy host
```

**Security Sections**: Security-related configurations
```
🔒 SSL Configuration
Configure certificates and security settings
```

**Advanced Sections**: Expert-level options
```
⚙️ Advanced Configuration
Advanced settings for experienced users
```

**Warning Sections**: Settings requiring caution
```
⚠️ Custom Configuration
Custom nginx configuration - use with caution
```

---

## Auto-Save Feature

### How Auto-Save Works

The auto-save feature automatically saves your changes while you work:

1. **Trigger**: Activates 2 seconds after you stop typing
2. **Validation**: Only saves if form data is valid
3. **Indication**: Shows "Saving...", "Saved", or "Error" status
4. **Background**: Saves without interrupting your work

### Auto-Save Indicators

**Status Indicators**:
- 🔵 **Idle**: No pending changes
- 🟡 **Saving**: Currently saving changes
- 🟢 **Saved**: Changes saved successfully
- 🔴 **Error**: Save failed (hover for details)

### When Auto-Save Occurs

- **Field Changes**: After modifying any form field
- **Tab Switches**: When moving between tabs
- **Section Collapse**: When collapsing form sections
- **Focus Loss**: When clicking outside the drawer

### Disabling Auto-Save

Auto-save can be disabled per form:
1. Look for "Auto-save" toggle in drawer header
2. Toggle off to disable automatic saving
3. Use manual Save button when ready

---

## Form Validation and Error Handling

### Real-time Validation

The system validates your input as you type:

#### Field-Level Validation
- **Required Fields**: Show error immediately when left empty
- **Format Validation**: Check email, domain, IP address formats
- **Range Validation**: Verify numbers are within acceptable ranges
- **Custom Rules**: Business logic validation (e.g., port conflicts)

#### Visual Error Indicators

**Field Errors**:
```
Domain Names *
┌─────────────────────────────────────────────┐
│ invalid-domain                              │ ❌
└─────────────────────────────────────────────┘
⚠️ Please enter a valid domain name
```

**Section Errors**:
```
📋 Basic Settings                          [2]
    ↑ Error count badge
```

**Tab Errors**:
```
[ Details ❌ ] [ SSL ] [ Advanced ]
        ↑ Error indicator
```

### Error Types

#### Validation Errors
- **Format Errors**: Invalid email, domain, or IP address format
- **Required Fields**: Missing mandatory information
- **Range Errors**: Numbers outside acceptable ranges
- **Duplicate Values**: Conflicting or duplicate entries

#### System Errors
- **Network Errors**: Connection or server issues
- **Permission Errors**: Insufficient access rights
- **Conflict Errors**: Resource conflicts (e.g., domain already exists)
- **Resource Errors**: Missing dependencies (e.g., certificate not found)

### Error Recovery

When errors occur:

1. **Review Error Messages**: Read specific error descriptions
2. **Fix Issues**: Correct the highlighted problems
3. **Retry**: Attempt the action again
4. **Contact Support**: If errors persist, contact administrator

---

## Accessibility Features

The interface is designed to be accessible to all users:

### Screen Reader Support

- **Semantic HTML**: Proper headings, labels, and structure
- **ARIA Labels**: Descriptive labels for complex interactions
- **Live Regions**: Announce dynamic content changes
- **Form Labels**: All form fields have associated labels

### Keyboard Navigation

#### Tab Order
The interface follows logical tab order:
1. Main navigation
2. Page content (tables, buttons)
3. Drawer content (when open)
4. Footer actions

#### Keyboard Shortcuts

**Global Shortcuts**:
- `Tab` / `Shift+Tab`: Navigate forward/backward
- `Enter`: Activate buttons and links
- `Space`: Toggle checkboxes and expand sections
- `Escape`: Close dialogs and drawers
- `Ctrl+S`: Save current form (when applicable)

**Drawer-Specific**:
- `Ctrl+Tab`: Next tab
- `Ctrl+Shift+Tab`: Previous tab
- `Alt+C`: Cancel/Close
- `Alt+S`: Save

**Table Navigation**:
- `Arrow Keys`: Navigate table cells
- `Home/End`: First/Last column
- `Page Up/Down`: Scroll table content

### Visual Accessibility

#### High Contrast Support
- **System Theme**: Respects OS high contrast settings
- **Color Blind Friendly**: Uses patterns and text in addition to color
- **Clear Focus**: Visible focus indicators for keyboard users

#### Text and Sizing
- **Readable Fonts**: Clear, sans-serif typography
- **Scalable Text**: Respects browser zoom settings
- **Sufficient Contrast**: Meets WCAG AA standards

### Motor Accessibility

- **Large Click Targets**: Buttons and links are easily clickable
- **Forgiving Interactions**: Generous click areas and hover zones
- **No Time Limits**: Auto-save provides adequate time for input
- **Sticky Focus**: Focus doesn't jump unexpectedly

---

## Mobile Usage

### Responsive Design

The interface adapts to different screen sizes:

#### Mobile Layout Changes
- **Full-Width Drawers**: Drawers occupy full screen on mobile
- **Stacked Navigation**: Tab navigation becomes scrollable
- **Touch-Friendly**: Larger buttons and touch targets
- **Simplified Tables**: Essential columns only

#### Mobile Interactions

**Drawer Navigation**:
```
📱 Mobile Drawer View
┌─────────────────────────┐
│ ← Edit Proxy Host    ✕  │
├─────────────────────────┤
│                         │
│ < Details SSL Advanced >│
│   ─────                 │
│                         │
│ Form Content Here       │
│                         │
│                         │
├─────────────────────────┤
│         [Save]          │
└─────────────────────────┘
```

**Touch Gestures**:
- **Swipe Left/Right**: Navigate between tabs
- **Pull to Refresh**: Refresh data tables
- **Long Press**: Access context menus
- **Pinch to Zoom**: Zoom interface elements

### Mobile-Specific Features

#### Optimized Forms
- **Virtual Keyboard**: Appropriate keyboard types (email, number, URL)
- **Input Modes**: Optimized for touch input
- **Auto-correction**: Disabled for technical fields (domains, IPs)
- **Zoom Prevention**: Prevents unwanted zooming on focus

#### Touch Navigation
- **Swipe Gestures**: Navigate between tabs and pages
- **Pull Down**: Refresh content
- **Tap Areas**: Generous touch targets throughout

---

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | Create new resource |
| `Ctrl+S` | Save current form |
| `Ctrl+F` | Focus search field |
| `Escape` | Close modal/drawer |
| `F5` | Refresh page data |
| `Ctrl+/` | Show shortcut help |

### Navigation Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Next element |
| `Shift+Tab` | Previous element |
| `Enter` | Activate/Select |
| `Space` | Toggle/Expand |
| `Arrow Keys` | Navigate lists/tables |
| `Home/End` | First/Last item |

### Drawer Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |
| `Alt+C` | Cancel/Close |
| `Alt+S` | Save |
| `Ctrl+R` | Reset form |
| `F1` | Show help |

### Table Shortcuts

| Shortcut | Action |
|----------|--------|
| `Arrow Keys` | Navigate cells |
| `Enter` | Edit selected row |
| `Delete` | Delete selected row |
| `Ctrl+A` | Select all |
| `Page Up/Down` | Scroll content |

---

## Tips and Best Practices

### Efficient Workflow

#### Planning Your Changes
1. **Review Current Settings**: Understand existing configuration
2. **Plan Changes**: Think through what you want to achieve
3. **Use Tabs**: Organize related settings using tab structure
4. **Save Frequently**: Use Ctrl+S or rely on auto-save

#### Working with Multiple Resources
1. **Open Multiple Tabs**: Use browser tabs for different resources
2. **Use Search**: Quickly locate specific items
3. **Bookmark Common Tasks**: Save frequently accessed pages
4. **Use Filters**: Narrow down large lists efficiently

### Form Best Practices

#### Domain Configuration
- **Use Valid Domains**: Ensure domains are properly formatted
- **Test Domains**: Verify domains resolve correctly
- **Plan SSL**: Consider certificate requirements early
- **Document Changes**: Use description fields for notes

#### SSL Configuration
- **Certificate Planning**: Prepare certificates before configuring
- **Wildcard Usage**: Consider wildcard certificates for subdomains
- **Renewal Tracking**: Note certificate expiration dates
- **Test HTTPS**: Verify SSL configuration works correctly

#### Performance Optimization
- **Cache Settings**: Use appropriate cache headers
- **Compression**: Enable gzip compression when beneficial
- **Rate Limiting**: Configure rate limits for security
- **Monitor Resources**: Watch resource usage in dashboard

### Troubleshooting Common Issues

#### Form Won't Save
1. **Check Validation**: Look for red error indicators
2. **Review Required Fields**: Ensure all required fields are completed
3. **Check Network**: Verify internet connection
4. **Try Manual Save**: Use Save button instead of auto-save

#### Auto-Save Not Working
1. **Check Status**: Look at auto-save indicator
2. **Fix Validation Errors**: Auto-save only works with valid data
3. **Check Network**: Verify connection stability
4. **Refresh Page**: Reload if issues persist

#### Navigation Issues
1. **Check Permissions**: Ensure you have access rights
2. **Clear Browser Cache**: Refresh cached resources
3. **Try Different Browser**: Test with alternative browser
4. **Contact Administrator**: Get help if issues persist

### Accessibility Tips

#### For Screen Reader Users
- **Use Landmarks**: Navigate by headings and regions
- **Listen to Descriptions**: Error messages provide specific guidance
- **Use Tables**: Navigate data using table navigation commands
- **Check Live Regions**: Listen for auto-save status announcements

#### For Keyboard Users
- **Learn Shortcuts**: Memorize common keyboard shortcuts
- **Use Tab Order**: Follow logical navigation sequence
- **Focus Indicators**: Watch for visible focus highlights
- **Skip Links**: Use skip navigation when available

#### For Motor Impairment Users
- **Take Your Time**: No time limits on form completion
- **Use Auto-Save**: Reduces need for frequent manual saving
- **Large Targets**: All interactive elements are easily clickable
- **Voice Control**: Interface works with voice control software

This user interface guide provides comprehensive information for using the NPMDeck refactored system effectively. The interface is designed to be intuitive while providing powerful configuration capabilities for nginx proxy management.