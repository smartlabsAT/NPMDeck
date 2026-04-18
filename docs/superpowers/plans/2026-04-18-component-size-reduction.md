# Component Size Reduction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split 9 oversized React components to <500 lines each by extracting focused sub-components, preserving all behavior.

**Architecture:** Pure refactoring — no behavior changes, no API changes. Each file is split into a main orchestrator component plus 2-4 sub-components with single responsibilities. Sub-components are colocated with parent (same directory) unless genuinely reusable elsewhere. All existing imports in the rest of the codebase keep working via unchanged default exports.

**Tech Stack:** React 19, TypeScript 5.9 (strict mode), MUI v7, Vite 7, Vitest 4.

**Issue:** [#103](https://github.com/smartlabsAT/NPMDeck/issues/103) — Part of Epic #41

---

## Baseline Verification

Before making any changes, verify the project is in a green state:

```bash
pnpm run lint       # expect: 0 errors, 0 warnings
pnpm run typecheck  # expect: 0 errors
pnpm run test:run   # expect: 64 tests passing
```

If any of these fail before starting, STOP and investigate — do not refactor on top of a broken baseline.

## File Structure

### Files Created (extracted sub-components)

| Parent File | New Sub-component Files |
|---|---|
| `ProxyHostInfoPanel.tsx` | `ProxyHostStatusOverview.tsx`, `ProxyHostBasicInfoSection.tsx`, `ProxyHostDomainListSection.tsx`, `ProxyHostConfigurationSection.tsx` |
| `UIPreferencesTab.tsx` | `ContainerPreferencesTable.tsx`, `ContainerPreferencesCards.tsx`, `DrawerSettingsPanel.tsx` |
| `AuditLog.tsx` | `auditLogColumns.tsx`, `AuditLogMetaDialog.tsx` |
| `Users.tsx` | `useUserTableColumns.tsx`, `useUserBulkActions.ts` |
| `AccessListDrawer.tsx` | `AuthItemForm.tsx`, `AccessRuleForm.tsx` |
| `BaseDrawer.tsx` | `DrawerCloseConfirmDialog.tsx`, `DrawerHeader.tsx` |
| `BaseDialog.tsx` | `DialogSeverityHeader.tsx` |
| `RedirectionHostDrawer.tsx` | `RedirectionSslSection.tsx`, `LetsEncryptForm.tsx` |
| `CertificateDrawer.tsx` | `LetsEncryptSection.tsx`, `CustomCertificateSection.tsx` |

### Files Modified (parent files trimmed)

All 9 parent files are modified to import and render the new sub-components. Default exports remain unchanged so consumer imports do not need updating.

### No other files touched

No changes to tests, API layer, utils, hooks, or other components. This is strictly UI structural refactoring.

---

## Task Ordering Rationale

Tasks are ordered from simplest to hardest. Each task is self-contained and committable. Earlier tasks build confidence in the extraction pattern; later tasks apply the same pattern to more complex components.

| # | File | Target Reduction | Complexity |
|---|---|---|---|
| 1 | ProxyHostInfoPanel | 501 → ~100 | LOW (read-only sections) |
| 2 | UIPreferencesTab | 514 → ~150 | LOW (clear responsive split) |
| 3 | AuditLog | 556 → ~300 | LOW-MEDIUM (columns + dialog) |
| 4 | Users | 503 → ~250 | MEDIUM (columns hook + bulk actions) |
| 5 | AccessListDrawer | 522 → ~380 | MEDIUM (memoized sub-forms) |
| 6 | BaseDrawer | 514 → ~420 | MEDIUM (foundational, high reuse) |
| 7 | BaseDialog | 506 → ~450 | MEDIUM (foundational) |
| 8 | RedirectionHostDrawer | 601 → ~300 | HIGH (LE config is intricate) |
| 9 | CertificateDrawer | 593 → ~280 | HIGH (LE vs custom branching) |

---

## Task 1: Split ProxyHostInfoPanel (501 → ~100 lines)

**Files:**
- Modify: `src/components/features/proxy-hosts/ProxyHostInfoPanel.tsx`
- Create: `src/components/features/proxy-hosts/ProxyHostStatusOverview.tsx`
- Create: `src/components/features/proxy-hosts/ProxyHostBasicInfoSection.tsx`
- Create: `src/components/features/proxy-hosts/ProxyHostDomainListSection.tsx`
- Create: `src/components/features/proxy-hosts/ProxyHostConfigurationSection.tsx`

### Step 1: Baseline — capture current state

- [ ] Confirm file length: `wc -l src/components/features/proxy-hosts/ProxyHostInfoPanel.tsx` → expect 501
- [ ] Run baseline: `pnpm run lint && pnpm run typecheck && pnpm run test:run`
- [ ] All must pass before proceeding.

### Step 2: Extract `ProxyHostStatusOverview`

- [ ] Create `src/components/features/proxy-hosts/ProxyHostStatusOverview.tsx`.
- [ ] Move the `{/* Status Overview */}` Grid block (lines 55-155 of current file) into a new component.
- [ ] Props interface:
  ```tsx
  interface ProxyHostStatusOverviewProps {
    host: ProxyHost
    onNavigateToAccess: () => void
  }
  ```
- [ ] Export default `ProxyHostStatusOverview`. Copy only icons used in this block (`CheckIcon`, `WarningIcon`, `BlockIcon`, `HttpsIcon`, `HttpIcon`, `SecurityIcon`).
- [ ] Do NOT wrap the extracted content in `<Grid size={12}>` — the parent keeps that layout grid.

### Step 3: Extract `ProxyHostBasicInfoSection`

- [ ] Create `src/components/features/proxy-hosts/ProxyHostBasicInfoSection.tsx`.
- [ ] Move the `{/* Basic Information */}` Grid block (lines 156-273) into the new component.
- [ ] Props interface:
  ```tsx
  interface ProxyHostBasicInfoSectionProps {
    host: ProxyHost
    onCopyToClipboard: (text: string, label?: string) => void
  }
  ```
- [ ] Import `SwapHorizIcon`, `PersonIcon`, `CopyIcon`, `formatDate`.

### Step 4: Extract `ProxyHostDomainListSection`

- [ ] Create `src/components/features/proxy-hosts/ProxyHostDomainListSection.tsx`.
- [ ] Move the `{/* Domain Names */}` Grid block (lines 277-319) into the new component.
- [ ] Props interface:
  ```tsx
  interface ProxyHostDomainListSectionProps {
    host: ProxyHost
    expanded: boolean
    copiedText: string
    onToggle: () => void
    onCopyToClipboard: (text: string, label?: string) => void
  }
  ```
- [ ] Import `LanguageIcon`, `CopyIcon`, `ExpandLess`, `ExpandMore`.

### Step 5: Extract `ProxyHostConfigurationSection`

- [ ] Create `src/components/features/proxy-hosts/ProxyHostConfigurationSection.tsx`.
- [ ] Move the `{/* Configuration */}` Grid block (lines 320-471) plus the Nginx Error alert block (lines 472-497) into the new component. (Grouping configuration + its related error keeps the feature-completeness in one place.)
- [ ] Props interface:
  ```tsx
  interface ProxyHostConfigurationSectionProps {
    host: ProxyHost
  }
  ```
- [ ] Import `SettingsIcon`, `SpeedIcon`, `BlockIcon`, `WebSocketIcon`, `SecurityIcon`, `CheckIcon`.

### Step 6: Trim parent file

- [ ] Rewrite `ProxyHostInfoPanel.tsx` to import and render the 4 new sub-components.
- [ ] Expected new file structure:
  ```tsx
  import { Grid, Divider } from '@mui/material'
  import { ProxyHost } from '../../../api/proxyHosts'
  import ProxyHostStatusOverview from './ProxyHostStatusOverview'
  import ProxyHostBasicInfoSection from './ProxyHostBasicInfoSection'
  import ProxyHostDomainListSection from './ProxyHostDomainListSection'
  import ProxyHostConfigurationSection from './ProxyHostConfigurationSection'

  interface ProxyHostInfoPanelProps {
    host: ProxyHost
    expandedSections: Record<string, boolean>
    copiedText: string
    onToggleSection: (section: string) => void
    onCopyToClipboard: (text: string, label?: string) => void
    onNavigateToAccess: () => void
  }

  const ProxyHostInfoPanel = ({ host, expandedSections, copiedText, onToggleSection, onCopyToClipboard, onNavigateToAccess }: ProxyHostInfoPanelProps) => (
    <Grid container spacing={3}>
      <Grid size={12}>
        <ProxyHostStatusOverview host={host} onNavigateToAccess={onNavigateToAccess} />
      </Grid>
      <Grid size={12}>
        <ProxyHostBasicInfoSection host={host} onCopyToClipboard={onCopyToClipboard} />
      </Grid>
      <Grid size={12}><Divider /></Grid>
      <Grid size={12}>
        <ProxyHostDomainListSection
          host={host}
          expanded={!!expandedSections.domains}
          copiedText={copiedText}
          onToggle={() => onToggleSection('domains')}
          onCopyToClipboard={onCopyToClipboard}
        />
      </Grid>
      <Grid size={12}><Divider /></Grid>
      <Grid size={12}>
        <ProxyHostConfigurationSection host={host} />
      </Grid>
    </Grid>
  )

  export default ProxyHostInfoPanel
  ```

### Step 7: Verify

- [ ] `wc -l src/components/features/proxy-hosts/ProxyHostInfoPanel.tsx` → expect <500 (target ~100)
- [ ] `pnpm run lint` → 0 errors
- [ ] `pnpm run typecheck` → 0 errors
- [ ] `pnpm run test:run` → 64 tests still passing

### Step 8: Commit

```bash
git add src/components/features/proxy-hosts/ProxyHostInfoPanel.tsx \
        src/components/features/proxy-hosts/ProxyHostStatusOverview.tsx \
        src/components/features/proxy-hosts/ProxyHostBasicInfoSection.tsx \
        src/components/features/proxy-hosts/ProxyHostDomainListSection.tsx \
        src/components/features/proxy-hosts/ProxyHostConfigurationSection.tsx
git commit -m "refactor: split ProxyHostInfoPanel into focused sub-components

Part of #103"
```

---

## Task 2: Split UIPreferencesTab (514 → ~150 lines)

**Files:**
- Modify: `src/pages/settings/UIPreferencesTab.tsx`
- Create: `src/pages/settings/ContainerPreferencesTable.tsx`
- Create: `src/pages/settings/ContainerPreferencesCards.tsx`
- Create: `src/pages/settings/DrawerSettingsPanel.tsx`
- Create: `src/pages/settings/resourceIcons.tsx` (shared `RESOURCE_ICONS` map)

### Step 1: Baseline

- [ ] `wc -l src/pages/settings/UIPreferencesTab.tsx` → expect 514
- [ ] Run lint/typecheck/test baseline.

### Step 2: Extract shared `RESOURCE_ICONS` map

- [ ] Create `src/pages/settings/resourceIcons.tsx`.
- [ ] Move the `RESOURCE_ICONS` constant (lines 45-54) and required icon imports into this file.
- [ ] Export `RESOURCE_ICONS` as named export.

### Step 3: Extract `ContainerPreferencesTable`

- [ ] Create `src/pages/settings/ContainerPreferencesTable.tsx`.
- [ ] Move the desktop table block (lines 237-362 — the `<TableContainer>` ... `</TableContainer>`) into the new component.
- [ ] Props interface:
  ```tsx
  interface ContainerPreferencesTableProps {
    containerPreferences: Record<string, ContainerPreference>
    visibleResources: CoreResource[]
    onSetContainerPreference: (entityKey: EntityType, action: 'view' | 'edit' | 'create', value: ContainerType) => void
    canManage: (resource: CoreResource) => boolean
  }
  ```
- [ ] Import `RESOURCE_ICONS` from the new shared file, plus the 3 action icons (`ViewIcon`, `EditIcon`, `AddIcon`), `CodeIcon`, and MUI Table primitives.

### Step 4: Extract `ContainerPreferencesCards`

- [ ] Create `src/pages/settings/ContainerPreferencesCards.tsx`.
- [ ] Move the mobile card block (lines 106-235 — the `<Stack>` containing cards) into the new component.
- [ ] Same props interface as `ContainerPreferencesTable`.
- [ ] Import `RESOURCE_ICONS`, Card, Stack, ToggleButtonGroup, Chip.

### Step 5: Extract `DrawerSettingsPanel`

- [ ] Create `src/pages/settings/DrawerSettingsPanel.tsx`.
- [ ] Move the `<FormSection title="Drawer Settings">` block (lines 365-476) into the new component.
- [ ] Props interface:
  ```tsx
  interface DrawerSettingsPanelProps {
    drawerPosition: 'left' | 'right'
    drawerWidth: number
    onSetDrawerPosition: (position: 'left' | 'right') => void
    onSetDrawerWidth: (width: number) => void
  }
  ```
- [ ] Component uses `useResponsive` internally.

### Step 6: Trim parent

- [ ] Rewrite `UIPreferencesTab.tsx` to:
  1. Render `isMobile ? <ContainerPreferencesCards /> : <ContainerPreferencesTable />`.
  2. Render `<DrawerSettingsPanel />`.
  3. Keep the info Alert and Reset button block inline (they are ~35 lines).
- [ ] Target: ~150 lines.

### Step 7: Verify

- [ ] `wc -l src/pages/settings/UIPreferencesTab.tsx` → expect <500
- [ ] Lint, typecheck, tests all pass.

### Step 8: Commit

```bash
git add src/pages/settings/UIPreferencesTab.tsx \
        src/pages/settings/ContainerPreferencesTable.tsx \
        src/pages/settings/ContainerPreferencesCards.tsx \
        src/pages/settings/DrawerSettingsPanel.tsx \
        src/pages/settings/resourceIcons.tsx
git commit -m "refactor: split UIPreferencesTab into focused sub-components

Part of #103"
```

---

## Task 3: Split AuditLog (556 → ~300 lines)

**Files:**
- Modify: `src/pages/AuditLog.tsx`
- Create: `src/pages/AuditLog/auditLogColumns.tsx`
- Create: `src/pages/AuditLog/AuditLogMetaDialog.tsx`

### Step 1: Baseline & Exploration

- [ ] `wc -l src/pages/AuditLog.tsx` → expect 556
- [ ] `grep -n "const columns" src/pages/AuditLog.tsx` — find column definitions
- [ ] `grep -n "const filters" src/pages/AuditLog.tsx` — find filter definitions
- [ ] Run baseline lint/typecheck/tests.

### Step 2: Extract column definitions

- [ ] Create `src/pages/AuditLog/auditLogColumns.tsx`.
- [ ] Move `getObjectIcon`, `getActionColor`, and the full `columns` array definition into an exported function:
  ```tsx
  export function getAuditLogColumns(): ResponsiveTableColumn<AuditLogEntry>[] { ... }
  ```
- [ ] The function should return the columns array (no `useMemo` wrapper — caller wraps it).

### Step 3: Extract metadata dialog

- [ ] Create `src/pages/AuditLog/AuditLogMetaDialog.tsx`.
- [ ] Move the metadata Dialog component (the one showing JSON metadata with syntax highlighting) into the new component.
- [ ] Props:
  ```tsx
  interface AuditLogMetaDialogProps {
    open: boolean
    entry: AuditLogEntry | null
    onClose: () => void
  }
  ```

### Step 4: Trim parent

- [ ] Update `AuditLog.tsx`:
  - Replace inline columns array with `const columns = useMemo(() => getAuditLogColumns(), [])`.
  - Replace inline metadata Dialog with `<AuditLogMetaDialog open={...} entry={...} onClose={...} />`.
- [ ] Remove unused imports (syntax highlighter, dialog primitives).

### Step 5: Verify

- [ ] `wc -l src/pages/AuditLog.tsx` → expect <500
- [ ] Lint, typecheck, tests pass.

### Step 6: Commit

```bash
git add src/pages/AuditLog.tsx src/pages/AuditLog/
git commit -m "refactor: extract AuditLog columns and metadata dialog

Part of #103"
```

---

## Task 4: Split Users.tsx (503 → ~250 lines)

**Files:**
- Modify: `src/pages/Users.tsx`
- Create: `src/pages/Users/useUserTableColumns.tsx`
- Create: `src/pages/Users/useUserBulkActions.ts`

### Step 1: Baseline

- [ ] `wc -l src/pages/Users.tsx` → expect 503
- [ ] Run baseline.

### Step 2: Extract `useUserTableColumns` hook

- [ ] Create `src/pages/Users/useUserTableColumns.tsx`.
- [ ] Define a hook that returns the memoized columns array:
  ```tsx
  interface UseUserTableColumnsParams {
    currentUserId: number | null
    onEdit: (user: User) => void
    onDelete: (user: User) => void
    onLoginAs: (user: User) => void
  }
  export function useUserTableColumns(params: UseUserTableColumnsParams): ResponsiveTableColumn<User>[]
  ```
- [ ] Move the entire columns definition into the hook.

### Step 3: Extract `useUserBulkActions` hook

- [ ] Create `src/pages/Users/useUserBulkActions.ts`.
- [ ] Define a hook encapsulating the bulk action configuration:
  ```ts
  interface UseUserBulkActionsParams {
    onBulkDelete: (users: User[]) => void
  }
  export function useUserBulkActions(params: UseUserBulkActionsParams): BulkAction<User>[]
  ```

### Step 4: Trim parent

- [ ] Replace inline column definitions with the new hook.
- [ ] Replace inline bulk actions with the new hook.

### Step 5: Verify & Commit

- [ ] `wc -l src/pages/Users.tsx` → expect <500
- [ ] Lint, typecheck, tests pass.
- [ ] Commit:
  ```bash
  git add src/pages/Users.tsx src/pages/Users/
  git commit -m "refactor: extract Users columns and bulk actions into hooks

  Part of #103"
  ```

---

## Task 5: Split AccessListDrawer (522 → ~380 lines)

**Files:**
- Modify: `src/components/features/access-lists/AccessListDrawer.tsx`
- Create: `src/components/features/access-lists/AuthItemForm.tsx`
- Create: `src/components/features/access-lists/AccessRuleForm.tsx`

### Step 1: Baseline

- [ ] `wc -l src/components/features/access-lists/AccessListDrawer.tsx` → expect 522
- [ ] Baseline lint/typecheck/test.

### Step 2: Extract `AuthItemForm`

- [ ] Create `src/components/features/access-lists/AuthItemForm.tsx`.
- [ ] Move the memoized `AuthItemComponent` function into this file.
- [ ] Export default. Keep the same `React.memo` wrapper (preserves focus-stability).
- [ ] Props interface matches current `ArrayItemProps<AuthItem>`.

### Step 3: Extract `AccessRuleForm`

- [ ] Create `src/components/features/access-lists/AccessRuleForm.tsx`.
- [ ] Move the memoized `AccessRuleComponent` function + `validateIpCidr` helper into this file.
- [ ] Export default. Keep `React.memo`.

### Step 4: Trim parent

- [ ] Replace inline component definitions with imports.
- [ ] Pass them as `ItemComponent` to `ArrayFieldManager`.

### Step 5: Verify & Commit

- [ ] `wc -l` → <500
- [ ] Lint/typecheck/test pass.
- [ ] Commit:
  ```bash
  git add src/components/features/access-lists/
  git commit -m "refactor: extract AccessListDrawer sub-forms

  Part of #103"
  ```

---

## Task 6: Split BaseDrawer (514 → ~420 lines)

**Files:**
- Modify: `src/components/base/BaseDrawer.tsx`
- Create: `src/components/base/DrawerCloseConfirmDialog.tsx`
- Create: `src/components/base/DrawerHeader.tsx`

### Step 1: Baseline

- [ ] `wc -l src/components/base/BaseDrawer.tsx` → expect 514
- [ ] Baseline checks.

### Step 2: Extract `DrawerCloseConfirmDialog`

- [ ] Create `src/components/base/DrawerCloseConfirmDialog.tsx`.
- [ ] Move the close confirmation `<Dialog>` (the "You have unsaved changes" dialog) into the new component.
- [ ] Props:
  ```tsx
  interface DrawerCloseConfirmDialogProps {
    open: boolean
    onConfirm: () => void
    onCancel: () => void
  }
  ```

### Step 3: Extract `DrawerHeader`

- [ ] Create `src/components/base/DrawerHeader.tsx`.
- [ ] Move the drawer title/subtitle/close-button area (the top bar before tabs) into the new component.
- [ ] Props:
  ```tsx
  interface DrawerHeaderProps {
    title: string
    subtitle?: string
    onClose: () => void
  }
  ```

### Step 4: Trim parent & Verify

- [ ] Replace extracted sections with new component imports.
- [ ] `wc -l` → <500
- [ ] Lint/typecheck/test pass.

### Step 5: Commit

```bash
git add src/components/base/BaseDrawer.tsx \
        src/components/base/DrawerCloseConfirmDialog.tsx \
        src/components/base/DrawerHeader.tsx
git commit -m "refactor: extract BaseDrawer header and close-confirm dialog

Part of #103"
```

---

## Task 7: Split BaseDialog (506 → ~450 lines)

**Files:**
- Modify: `src/components/base/BaseDialog.tsx`
- Create: `src/components/base/DialogSeverityHeader.tsx`

### Step 1: Baseline

- [ ] `wc -l src/components/base/BaseDialog.tsx` → expect 506
- [ ] Baseline checks.

### Step 2: Extract `DialogSeverityHeader`

- [ ] Create `src/components/base/DialogSeverityHeader.tsx`.
- [ ] Move the severity-aware dialog header (icon + title + close button with color styling per severity) into the new component.
- [ ] Also move the severity → icon/color mapping into this file.
- [ ] Props:
  ```tsx
  interface DialogSeverityHeaderProps {
    title: string
    subtitle?: string
    severity?: 'info' | 'warning' | 'error' | 'success'
    onClose?: () => void
  }
  ```

### Step 3: Trim parent & Verify

- [ ] Replace extracted section with import.
- [ ] `wc -l` → <500
- [ ] Lint/typecheck/test pass.

### Step 4: Commit

```bash
git add src/components/base/BaseDialog.tsx src/components/base/DialogSeverityHeader.tsx
git commit -m "refactor: extract BaseDialog severity header

Part of #103"
```

---

## Task 8: Split RedirectionHostDrawer (601 → ~300 lines)

**Files:**
- Modify: `src/components/RedirectionHostDrawer.tsx`
- Create: `src/components/features/redirection-hosts/RedirectionSslSection.tsx`
- Create: `src/components/features/redirection-hosts/LetsEncryptForm.tsx`

### Step 1: Baseline

- [ ] `wc -l src/components/RedirectionHostDrawer.tsx` → expect 601
- [ ] Baseline checks.

### Step 2: Create directory

- [ ] Ensure `src/components/features/redirection-hosts/` exists. Create it if not.

### Step 3: Extract `LetsEncryptForm`

- [ ] Create `src/components/features/redirection-hosts/LetsEncryptForm.tsx`.
- [ ] Move the Let's Encrypt configuration block (email, DNS challenge toggle, DNS provider selector, credentials textarea, propagation seconds input) into a new component.
- [ ] Props interface:
  ```tsx
  interface LetsEncryptFormProps {
    values: {
      letsencrypt_email: string
      dns_challenge: boolean
      dns_provider: string | null
      dns_provider_credentials: string
      propagation_seconds: number | null
    }
    errors: Record<string, string | undefined>
    onChange: (field: string, value: unknown) => void
  }
  ```
- [ ] This component is SSL-tab only, so it doesn't need to handle non-LE states.

### Step 4: Extract `RedirectionSslSection`

- [ ] Create `src/components/features/redirection-hosts/RedirectionSslSection.tsx`.
- [ ] Move the entire SSL tab content (certificate selector + force-SSL + HSTS switches + `<LetsEncryptForm>` when applicable) into this component.
- [ ] Props interface:
  ```tsx
  interface RedirectionSslSectionProps {
    values: { /* all SSL-related fields */ }
    errors: Record<string, string | undefined>
    certificates: Certificate[]
    onChange: (field: string, value: unknown) => void
  }
  ```

### Step 5: Trim parent & Verify

- [ ] Replace SSL tab body with `<RedirectionSslSection />`.
- [ ] `wc -l` → <500
- [ ] Lint/typecheck/test pass.
- [ ] Manual smoke check: open the file structure and verify imports are clean.

### Step 6: Commit

```bash
git add src/components/RedirectionHostDrawer.tsx \
        src/components/features/redirection-hosts/
git commit -m "refactor: extract RedirectionHost SSL section and Let's Encrypt form

Part of #103"
```

---

## Task 9: Split CertificateDrawer (593 → ~280 lines)

**Files:**
- Modify: `src/components/features/certificates/CertificateDrawer.tsx`
- Create: `src/components/features/certificates/LetsEncryptSection.tsx`
- Create: `src/components/features/certificates/CustomCertificateSection.tsx`

### Step 1: Baseline

- [ ] `wc -l src/components/features/certificates/CertificateDrawer.tsx` → expect 593
- [ ] Baseline checks.

### Step 2: Extract `LetsEncryptSection`

- [ ] Create `src/components/features/certificates/LetsEncryptSection.tsx`.
- [ ] Move the Let's Encrypt creation form (domains, email, DNS challenge, DNS provider selector + credentials) into the new component.
- [ ] Props interface:
  ```tsx
  interface LetsEncryptSectionProps {
    values: {
      domain_names: string[]
      meta: {
        letsencrypt_email: string
        dns_challenge: boolean
        dns_provider: string | null
        dns_provider_credentials: string
        propagation_seconds: number | null
      }
    }
    errors: Record<string, string | undefined>
    onChange: (field: string, value: unknown) => void
  }
  ```

### Step 3: Extract `CustomCertificateSection`

- [ ] Create `src/components/features/certificates/CustomCertificateSection.tsx`.
- [ ] Move the custom-cert upload form (name, domain_names, file dropzones for cert/key/intermediate, optional passphrase) into the new component.
- [ ] Props:
  ```tsx
  interface CustomCertificateSectionProps {
    values: { /* cert-specific fields */ }
    errors: Record<string, string | undefined>
    files: { cert: File | null; key: File | null; intermediate: File | null }
    onChange: (field: string, value: unknown) => void
    onFileChange: (type: 'cert' | 'key' | 'intermediate', file: File | null) => void
  }
  ```

### Step 4: Trim parent & Verify

- [ ] Replace the large conditional blocks with `{provider === 'letsencrypt' ? <LetsEncryptSection ... /> : <CustomCertificateSection ... />}`.
- [ ] `wc -l` → <500
- [ ] Lint/typecheck/test pass.

### Step 5: Commit

```bash
git add src/components/features/certificates/
git commit -m "refactor: extract CertificateDrawer Let's Encrypt and custom cert sections

Part of #103"
```

---

## Final Verification

After all 9 tasks complete:

- [ ] Every target file is <500 lines: run `wc -l` on each
- [ ] `pnpm run lint` → 0 errors
- [ ] `pnpm run typecheck` → 0 errors
- [ ] `pnpm run test:run` → 64 tests passing
- [ ] `pnpm run build` → succeeds
- [ ] Manual smoke test of key flows:
  - [ ] Proxy host detail dialog — info panel sections render correctly
  - [ ] Settings → UI Preferences — table (desktop) and cards (mobile) work
  - [ ] Audit log — columns render, metadata dialog opens
  - [ ] Users page — table loads, bulk actions appear on selection
  - [ ] Access list drawer — auth items and access rules add/remove correctly
  - [ ] Certificate drawer — LE and custom cert flows both render
  - [ ] Redirection host drawer — SSL tab + LE form render

## Out of Scope (explicitly excluded)

- `FormSection.tsx` (548 lines) — intentional foundational utility; splitting would fragment its API.
- `ProxyHostDrawer.tsx` (551 lines) — tab sub-components already extracted in prior work (DetailsTab, SSLTab, AdvancedTab); the 551 lines are mostly orchestration state.
- DNS provider list deduplication between RedirectionHostDrawer and CertificateDrawer — noted as a follow-up; not required to hit the <500 line target.
- Shared `BaseTabDrawer` wrapper — worth considering later but would introduce new API surface; out of scope for pure size reduction.
