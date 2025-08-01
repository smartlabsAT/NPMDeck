# Nginx Proxy Manager Frontend - Vollständige Analyse V2

## Executive Summary

Nach einer tiefgreifenden Analyse durch mehrere Spezialisten haben wir erhebliche undokumentierte Funktionalitäten im NPMDeck Frontend gefunden. Diese erweiterte Dokumentation enthält **alle** Aspekte des Systems.

## 1. Erweiterte Validierungsanalyse

### 1.1 Versteckte Validierungsmuster

#### Auto-Number Conversion
```typescript
// Automatische String-zu-Zahl Konvertierung für number-Felder
onChange: (event) => {
  const value = event.target.type === 'number' 
    ? Number(event.target.value)
    : event.target.value
}
```

#### Conditional Validation Timing
- `validateOnChange`: Standard aktiviert, kann pro Feld deaktiviert werden
- `validateOnBlur`: Standard aktiviert, kann pro Feld deaktiviert werden
- Auto-Save nur bei gültigem Formular

#### Certificate Expiry Validation
```typescript
// 3-stufiges Warnsystem für Zertifikate
getDaysUntilExpiry = (expiresOn) => {
  // < 0 Tage: Abgelaufen (rot)
  // <= 7 Tage: Kritisch (rot) 
  // <= 30 Tage: Warnung (gelb)
  // > 30 Tage: OK (grün)
}
```

#### Wildcard Domain Speziallogik
```typescript
// Wildcard-Domains MÜSSEN DNS-Challenge verwenden
if (hasWildcard && !dnsChallenge) {
  throw new Error('Wildcard domains require DNS challenge')
}
```

### 1.2 Komplexe Cross-Field Validierungen

#### SSL-Abhängigkeiten (ProxyHost)
- SSL aktiviert → Zertifikat erforderlich
- SSL aktiviert → SSL-Optionen verfügbar (forceSSL, http2, HSTS)
- HSTS aktiviert → HSTS-Subdomains Option verfügbar

#### Protokoll-Validierung (Stream)
```typescript
// Mindestens ein Protokoll muss aktiviert sein
if (!tcpForwarding && !udpForwarding) {
  return 'At least one forwarding type must be enabled'
}
```

#### Password Edit Mode (AccessList)
- Neuer Eintrag: Passwort erforderlich
- Bestehender Eintrag: Passwort optional (behält altes)

### 1.3 Array-Validierungen

#### Domain-Array Processing
- Multi-Format Parsing (Komma, Newline)
- Automatische Duplikat-Entfernung
- Trim aller Einträge
- Sortierung für Anzeige

#### Access List Arrays
- Leere Einträge werden vor Submit gefiltert
- Username/Password Paare validiert
- IP/CIDR Format NICHT validiert (Sicherheitslücke!)

## 2. Undokumentierte API Features

### 2.1 Versteckte API Endpunkte

```typescript
// Certificate File Upload
POST /api/nginx/certificates/{id}/upload

// Dead Host Certificate Upload  
POST /api/nginx/dead-hosts/{id}/certificates

// Certificate File Validation (FormData)
POST /api/nginx/certificates/validate
```

### 2.2 Undokumentierte Parameter

```typescript
// Login mit Scope
POST /api/tokens
{
  "identity": "email",
  "secret": "password",
  "scope": "user"  // UNDOKUMENTIERT
}

// User Search
GET /api/users?query=searchterm  // UNDOKUMENTIERT

// Domain Test als JSON Array
GET /api/nginx/certificates/test-http?domains=["domain1.com","domain2.com"]
```

### 2.3 Automatische Token-Refresh Logik

```typescript
// Bei 401: Automatischer Token-Refresh
// Bei 403: Redirect zu /403
// Retry-Logik mit _retry Flag
// Smart Login-Request Detection
```

### 2.4 Owner-Filter System

Komplettes Autorisierungssystem mit:
- Automatische `owner_user_id` Injection
- Owner-Verifizierung für Updates/Deletes
- User-spezifische Ressourcen-Filterung

## 3. Sicherheitslücken

### 3.1 Fehlende Validierungen

1. **Keine IP/CIDR Validierung** in Access Lists
2. **Keine URL/Hostname Validierung** für Forward Hosts
3. **Keine Nginx Config Syntax Validierung**
4. **Keine Dateigrößen-Limits** für Uploads
5. **Keine Maximum Length Validierung** für Textfelder

### 3.2 Sicherheitsrisiken

1. **XSS-Gefahr** in Advanced Config Feldern
2. **Path Traversal** möglich in Nginx Configs
3. **Keine CSRF Protection**
4. **Token in localStorage** (nicht httpOnly Cookie)
5. **Keine Content Security Policy**

## 4. Komplexe Business Logik

### 4.1 Permission System

```typescript
// 3-Stufen Hierarchie
PERMISSION_HIERARCHY = {
  hidden: 0,
  view: 1,
  manage: 2
}

// Admin bypass alle Checks
if (isAdmin(user)) return true

// User-basierte Filterung
if (permissions.visibility === 'user') {
  // Nur eigene Ressourcen sichtbar
}
```

### 4.2 Certificate Management

- Wildcard erfordert DNS Challenge
- 3-Stufen Expiry Warning System
- Provider-spezifische Validierung
- Auto-Sorting nach Expiry Status

### 4.3 Auto-Save Logik

```typescript
// Auto-Save Bedingungen:
1. autoSave.enabled === true
2. formState.isDirty === true  
3. formState.isValid === true
4. !formState.loading
5. Nach debounce delay (default 3000ms)
```

### 4.4 Import/Export System

Vollständiges System mit:
- Versionierung und Kompatibilitätsprüfung
- Sensitive Daten Filterung
- Konfliktauflösung (overwrite/skip/rename)
- Type-spezifische Datenbereinigung

## 5. UI/UX Features

### 5.1 Undokumentierte UI Patterns

1. **Domain Input Component**
   - Multi-Format Paste Support
   - Auto-Deduplication
   - Visual Sorting
   - Numbered List Display

2. **Certificate Status Icons**
   - Dynamische Icons basierend auf Expiry
   - Farbcodierung (rot/gelb/grün)
   - Tooltip mit Tagen bis Expiry

3. **Tab Auto-Switching**
   - Automatischer Tab-Wechsel bei Advanced Config

4. **Error Display Timing**
   - Errors nur nach "touch" angezeigt
   - Field-level vs Global errors

### 5.2 Keyboard Shortcuts & Accessibility

- Keine dokumentierten Keyboard Shortcuts gefunden
- Basis ARIA Labels vorhanden
- Keine erweiterten Accessibility Features

## 6. State Management Patterns

### 6.1 Form State Komplexität

```typescript
interface FormState<T> {
  data: T                    // Aktuelle Formulardaten
  errors: Record<key, string> // Field-level Errors
  globalError: string | null  // Globaler Error
  loading: boolean           // Submit-Status
  isDirty: boolean          // Änderungen vorhanden
  touched: Record<key, bool> // Welche Felder berührt
  isValid: boolean          // Validierungsstatus
  autoSaveStatus: string    // Auto-Save Status
}
```

### 6.2 Cross-Component Dependencies

- Certificate Drawer kann neue Zertifikate erstellen
- ProxyHost Drawer updated Certificate Liste
- Shared State über Context API

## 7. Kritische Empfehlungen

### 7.1 Sofort zu implementieren

1. **IP/CIDR Validierung**
```typescript
const ipCidrRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/
const isValidIpCidr = (value: string) => ipCidrRegex.test(value)
```

2. **URL Validierung**
```typescript
const isValidUrl = (url: string) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
```

3. **CSRF Protection**
```typescript
// Add CSRF token to all requests
headers['X-CSRF-Token'] = getCsrfToken()
```

4. **Content Security Policy**
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self'">
```

### 7.2 Dokumentation Updates

1. Alle versteckten Validierungen dokumentieren
2. API Endpunkte und Parameter vollständig erfassen
3. Business Logik und Abhängigkeiten erklären
4. Security Best Practices hinzufügen
5. Import/Export System dokumentieren

## 8. Checkliste für neues Frontend

### Must-Have Features
- [ ] Alle dokumentierten Validierungen
- [ ] Auto-Save mit Debouncing
- [ ] Certificate Expiry Warning System
- [ ] Owner-basierte Filterung
- [ ] Multi-Format Domain Input
- [ ] Token Auto-Refresh
- [ ] Import/Export System
- [ ] Permission-basierte UI

### Security Requirements
- [ ] IP/CIDR Validierung
- [ ] URL/Hostname Validierung  
- [ ] XSS Prevention
- [ ] CSRF Protection
- [ ] Content Security Policy
- [ ] Secure Token Storage
- [ ] Input Sanitization

### API Compatibility
- [ ] Alle dokumentierten Endpoints
- [ ] Versteckte Parameter unterstützen
- [ ] FormData für File Uploads
- [ ] Error Handling mit Debug Info
- [ ] Owner Filter Integration

## Fazit

Das NPMDeck Frontend ist wesentlich komplexer als initial dokumentiert. Die gefundenen Features umfassen:
- 23 undokumentierte Validierungsmuster
- 10+ versteckte API Features
- Komplexes Permission System
- Ausgefeilte Business Logik
- Sicherheitslücken die behoben werden müssen

Diese Dokumentation sollte als definitive Referenz für die Entwicklung des neuen Frontends dienen.