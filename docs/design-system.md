# Nginx Proxy Manager - Design System Guide

Dieses Dokument definiert das Design System für das neue NPM Frontend mit Material-UI.

## Farbschema

### Primärfarben

Die Farben basieren auf dem aktuellen NPM-Design:

#### Hauptfarbe
- **Primary (Teal)**: `#2bcbba`
- **Primary Dark**: `#1fb6a6` (10% dunkler)
- **Primary Light**: `#4dd4c5` (10% heller)

#### Status-Farben
- **Success (Green)**: `#5eba00`
- **Warning (Yellow)**: `#f1c40f`
- **Error (Red)**: `#cd201f`
- **Info (Blue)**: `#467fcf`

#### Zusätzliche Farben
- **Pink**: `#f66d9b` (für spezielle Highlights)

#### Neutrale Farben
- **Text Primary**: `#303030`
- **Text Secondary**: `#495c68`
- **Background Default**: `#ffffff`
- **Background Paper**: `#f5fafd`
- **Divider**: `rgba(0, 0, 0, 0.12)`

### Material-UI Theme Configuration

```typescript
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2bcbba',
      dark: '#1fb6a6',
      light: '#4dd4c5',
    },
    secondary: {
      main: '#467fcf',
    },
    success: {
      main: '#5eba00',
    },
    warning: {
      main: '#f1c40f',
    },
    error: {
      main: '#cd201f',
    },
    info: {
      main: '#467fcf',
    },
    background: {
      default: '#ffffff',
      paper: '#f5fafd',
    },
    text: {
      primary: '#303030',
      secondary: '#495c68',
    },
  },
  typography: {
    fontFamily: '"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 400,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 400,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 400,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 400,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 1,
      },
    },
  },
});
```

## Komponenten-Mapping

### Legacy → Material-UI

| Legacy Component | Material-UI Component | Notes |
|-----------------|---------------------|-------|
| `.btn-teal` | `Button color="primary"` | Hauptaktion |
| `.btn-secondary` | `Button color="inherit"` | Sekundäraktion |
| `.btn-danger` | `Button color="error"` | Löschaktionen |
| `.card` | `Card` | Container |
| `.modal` | `Dialog` | Modals |
| `.form-control` | `TextField` | Input-Felder |
| `.custom-switch` | `Switch` | Toggle |
| `.selectgroup` | `ToggleButtonGroup` | Radio-Gruppen |
| `.nav-tabs` | `Tabs` | Tab-Navigation |
| `.table` | `Table` | Datentabellen |
| `.alert` | `Alert` | Benachrichtigungen |
| `.stamp` | `Avatar` | Status-Icons |

## Icons

NPM verwendet Feather Icons. Für Material-UI:

```typescript
// Material Icons entsprechen Feather Icons
import {
  Home,              // fe-home
  Monitor,           // fe-monitor
  Lock,              // fe-lock
  Shield,            // fe-shield
  Users,             // fe-users
  BookOpen,          // fe-book-open
  Settings,          // fe-settings
  Zap,              // fe-zap
  Shuffle,          // fe-shuffle
  Radio,            // fe-radio
  ZapOff,           // fe-zap-off
} from '@mui/icons-material';
```

## Layout-Prinzipien

### Spacing
- Verwende Material-UI's 8px Grid-System
- Standard-Abstände: 1 (8px), 2 (16px), 3 (24px), 4 (32px)

### Container
- Max-Width: 1200px für Hauptinhalt
- Padding: 24px auf Desktop, 16px auf Mobile

### Cards
- Standard-Padding: 24px
- Elevation: 1 (leichter Schatten)
- Border-Radius: 4px

## UI-Patterns

### Tabellen
```typescript
<TableContainer component={Paper}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Domain</TableCell>
        <TableCell>Status</TableCell>
        <TableCell align="right">Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {/* Rows */}
    </TableBody>
  </Table>
</TableContainer>
```

### Status-Badges
```typescript
<Chip 
  label="Online" 
  color="success" 
  size="small"
  icon={<Circle />}
/>
```

### Formulare
```typescript
<Box component="form" sx={{ '& > :not(style)': { m: 2 } }}>
  <TextField
    fullWidth
    label="Domain Names"
    required
    helperText="Kommaseparierte Liste"
  />
  <FormControl fullWidth>
    <InputLabel>Forward Scheme</InputLabel>
    <Select>
      <MenuItem value="http">HTTP</MenuItem>
      <MenuItem value="https">HTTPS</MenuItem>
    </Select>
  </FormControl>
</Box>
```

### Dialoge
```typescript
<Dialog open={open} maxWidth="md" fullWidth>
  <DialogTitle>Edit Proxy Host</DialogTitle>
  <DialogContent>
    {/* Tab-basiertes Layout */}
    <Tabs value={tabValue}>
      <Tab label="Details" />
      <Tab label="SSL" />
      <Tab label="Advanced" />
    </Tabs>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
    <Button onClick={handleSave} variant="contained">Save</Button>
  </DialogActions>
</Dialog>
```

## Responsive Design

### Breakpoints
- xs: 0px
- sm: 600px
- md: 960px
- lg: 1280px
- xl: 1920px

### Mobile-First
```typescript
<Grid container spacing={3}>
  <Grid item xs={12} md={6} lg={3}>
    {/* Card */}
  </Grid>
</Grid>
```

## Animationen

- Verwende Material-UI's eingebaute Transitions
- Standard-Duration: 300ms
- Easing: ease-in-out

```typescript
import { Fade, Slide } from '@mui/material';

<Fade in={visible} timeout={300}>
  <Card>...</Card>
</Fade>
```

## Dark Mode (Optional für später)

```typescript
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2bcbba',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});
```

## Best Practices

1. **Konsistenz**: Verwende immer die definierten Farben und Komponenten
2. **Accessibility**: Stelle sicher, dass Farbkontraste WCAG AA erfüllen
3. **Performance**: Nutze Material-UI's Tree-Shaking für kleinere Bundles
4. **Customization**: Erweitere das Theme statt inline-styles zu verwenden

## Migration Checkliste

- [ ] Material-UI installieren
- [ ] Theme erstellen und konfigurieren
- [ ] Font "Source Sans Pro" einbinden
- [ ] Icon-Set vorbereiten
- [ ] Basis-Layout-Komponenten erstellen
- [ ] Form-Komponenten standardisieren
- [ ] Table-Komponenten mit Sortierung/Filter
- [ ] Status-Komponenten (Online/Offline Badges)
- [ ] Loading-States definieren
- [ ] Error-Boundaries implementieren

Diese Design-Richtlinien sorgen für ein konsistentes Look & Feel, das dem aktuellen NPM entspricht, aber mit modernen Material-UI Komponenten umgesetzt wird.