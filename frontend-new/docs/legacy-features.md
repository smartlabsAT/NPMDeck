# Nginx Proxy Manager - Legacy Frontend Funktionalitäten

Dieses Dokument beschreibt alle Funktionalitäten des aktuellen Nginx Proxy Manager Frontends (basierend auf Backbone.js/Marionette). Es dient als Referenz für die Entwicklung eines neuen, modernen Frontends.

## Übersicht

Das aktuelle Frontend ist eine Single-Page Application (SPA) mit folgenden Hauptbereichen:

- **Dashboard** - Übersichtsseite mit Statistiken
- **Hosts** - Verwaltung verschiedener Host-Typen
- **Certificates** - SSL-Zertifikatsverwaltung
- **Access Lists** - Zugriffskontrolle
- **Users** - Benutzerverwaltung
- **Audit Log** - Aktivitätsprotokoll
- **Settings** - Systemeinstellungen

## 1. Authentifizierung & Session Management

### Login
- **Route**: `/login`
- **Features**:
  - Email/Passwort-basierte Anmeldung
  - JWT-Token-basierte Authentifizierung
  - Token-Refresh-Mechanismus
  - Automatischer Logout bei Token-Ablauf
  - "Remember Me" Funktionalität über Token-Speicherung

### Session Management
- JWT-Token im LocalStorage
- Automatisches Token-Refresh alle 15 Minuten
- User-Informationen im Cache
- Redirect zu Login bei 401-Fehlern
- Multi-Account-Support (Token-Stack für Account-Switching)
- "Login als anderer Benutzer" Funktionalität

## 2. Dashboard

### Hauptfunktionen
- **Route**: `/` (Standard-Route)
- **Komponenten**:
  - Begrüßung mit Benutzername
  - Statistik-Karten für jeden Host-Typ
  - Anzahl aktiver/inaktiver Hosts
  - Quick-Links zu den jeweiligen Verwaltungsbereichen

### Berechtigungsbasierte Anzeige
- Karten werden nur angezeigt, wenn der Benutzer die entsprechenden Berechtigungen hat
- Dynamische Spaltenbreite basierend auf sichtbaren Elementen

## 3. Proxy Hosts

### Übersicht
- **Route**: `/nginx/proxy`
- **API**: `/api/nginx/proxy-hosts`
- **Hauptfunktion**: HTTP/HTTPS Reverse Proxy für Webdienste

### Features

#### Basis-Konfiguration
- **Domain Names**: Mehrere Domains pro Host (kommasepariert)
- **Forward Scheme**: HTTP oder HTTPS
- **Forward Host**: IP-Adresse oder Hostname des Zielservers
- **Forward Port**: Zielport (Standard: 80/443)
- **Websocket Support**: Upgrade-Header für WebSocket-Verbindungen
- **Zustand**: Aktiviert/Deaktiviert

#### SSL-Optionen
- **SSL aktivieren**: HTTPS-Terminierung
- **Force SSL**: Automatische HTTP zu HTTPS Weiterleitung
- **HTTP/2 Support**: Moderne Protokollunterstützung
- **HSTS**: HTTP Strict Transport Security
  - HSTS Enabled
  - Include Subdomains Option
  - Max Age einstellbar
- **SSL-Zertifikat-Optionen**:
  - Let's Encrypt (automatisch)
  - Benutzerdefiniertes Zertifikat
  - Kein SSL

#### Sicherheit & Performance
- **Block Common Exploits**: Vordefinierte Nginx-Regeln gegen bekannte Exploits
- **Cache Assets**: Browser-Caching für statische Dateien
- **Access List**: IP-basierte Zugriffskontrolle oder Basic Auth

#### Custom Locations
- Pfad-spezifische Konfigurationen
- Eigener Forward-Host/Port pro Location
- Custom Nginx-Konfiguration pro Location

#### Advanced Configuration
- Benutzerdefinierte Nginx-Konfiguration
- Zugriff auf Nginx-Variablen
- Warnung vor Risiken

### UI-Komponenten
- Tabellenansicht mit Such- und Filterfunktion
- Modal-Dialog für Erstellen/Bearbeiten
- Tab-basierte Konfiguration (Details, Locations, SSL, Advanced)
- Inline-Statusanzeige (Online/Offline)
- Aktionsmenü (Bearbeiten, Deaktivieren, Löschen)

## 4. Redirection Hosts

### Übersicht
- **Route**: `/nginx/redirection`
- **API**: `/api/nginx/redirection-hosts`
- **Hauptfunktion**: Domain-Weiterleitungen

### Features
- **Domain Names**: Quelldomains
- **Forward Scheme**: HTTP oder HTTPS
- **Forward Domain**: Zieldomain
- **HTTP Status Code**: 
  - 301 (Permanent)
  - 302 (Temporary)
  - 307 (Temporary Redirect)
  - 308 (Permanent Redirect)
- **Preserve Path**: Pfad bei Weiterleitung beibehalten
- **SSL-Optionen**: Wie bei Proxy Hosts
- **Advanced Configuration**: Custom Nginx Config

## 5. 404 Hosts (Dead Hosts)

### Übersicht
- **Route**: `/nginx/404`
- **API**: `/api/nginx/dead-hosts`
- **Hauptfunktion**: Custom 404-Seiten für Domains

### Features
- **Domain Names**: Domains für 404-Seite
- **Custom Page**: HTML-Editor für eigene Fehlerseite
- **SSL-Optionen**: Wie bei anderen Host-Typen
- **Advanced Configuration**: Custom Nginx Config

### Standard-404-Seite
- Nginx Proxy Manager Branding
- "Congratulations" Nachricht
- Hinweis auf fehlende Konfiguration

## 6. Streams

### Übersicht
- **Route**: `/nginx/stream`
- **API**: `/api/nginx/streams`
- **Hauptfunktion**: TCP/UDP Port-Forwarding

### Features
- **Incoming Port**: Eingehender Port
- **Protocol**: TCP oder UDP
- **Forwarding Host**: Zielserver
- **Forwarding Port**: Zielport
- **TCP Fast Open**: Performance-Optimierung
- **Proxy Protocol**: Support für PROXY Protocol
- **SSL-Support**: 
  - SSL-Terminierung für TCP-Streams
  - Zertifikatauswahl

## 7. Access Lists

### Übersicht
- **Route**: `/nginx/access`
- **API**: `/api/nginx/access-lists`
- **Hauptfunktion**: Zugriffskontrolle für Hosts

### Features
- **Name**: Bezeichnung der Access List
- **Satisfy**: "Any" oder "All" (Kombinationslogik)
- **Pass Auth to Host**: Auth-Headers weitergeben

### Authorization
- **HTTP Basic Auth**:
  - Benutzername/Passwort-Paare
  - Mehrere Benutzer pro Liste

### Access Rules
- **Allow**: IP-Adressen/Bereiche erlauben
- **Deny**: IP-Adressen/Bereiche blockieren
- CIDR-Notation unterstützt
- IPv4 und IPv6 Support

### UI-Features
- Dynamisches Hinzufügen/Entfernen von Regeln
- Sortierbare Regelliste
- Validierung von IP-Adressen

## 8. SSL Certificates

### Übersicht
- **Route**: `/nginx/certificates`
- **API**: `/api/nginx/certificates`
- **Hauptfunktion**: SSL-Zertifikatsverwaltung

### Let's Encrypt Integration
- **Domain-Validierung**: HTTP-01 Challenge
- **DNS Challenge**: 
  - Unterstützung für verschiedene DNS-Provider
  - Credentials-Konfiguration
  - Propagation-Zeit einstellbar
- **Wildcard-Zertifikate**: Nur mit DNS Challenge
- **Auto-Renewal**: Automatische Erneuerung

### Unterstützte DNS-Provider
- Cloudflare
- DigitalOcean
- DNSPod
- DuckDNS
- GoDaddy
- Google
- Hetzner
- Linode
- NameCom
- Netcup
- Route53
- Vultr
- und viele mehr...

### Custom Certificates
- **Upload-Funktion**: 
  - Certificate (.crt/.pem)
  - Private Key (.key)
  - Intermediate Certificate (optional)
- **Validierung**: Zertifikat-Gültigkeit prüfen
- **Keine Passphrase-Unterstützung**: Keys müssen unverschlüsselt sein

### Management-Features
- Zertifikat-Details anzeigen
- Ablaufdatum-Tracking
- Manuelle Erneuerung
- Download-Funktion
- Test HTTP-Erreichbarkeit
- Zertifikat-Validierung vor Speicherung
- Fehlermeldungen bei Let's Encrypt Problemen

## 9. Users & Permissions

### Benutzerverwaltung
- **Route**: `/users`
- **API**: `/api/users`
- **Features**:
  - Benutzer erstellen/bearbeiten/löschen
  - Passwort ändern
  - Rollen: Administrator oder User
  - Gravatar-Integration für Profilbilder

### Berechtigungssystem
- **Sichtbarkeit**:
  - User: Nur eigene Objekte
  - All: Alle Objekte sehen
- **Berechtigungen pro Feature**:
  - Manage: Vollzugriff (Erstellen, Bearbeiten, Löschen)
  - View: Nur Lesezugriff
  - Hidden: Kein Zugriff
- **Login als anderer Benutzer**: Admin kann sich als andere Benutzer einloggen

### Berechtigbare Features
- Proxy Hosts
- Redirection Hosts
- Dead Hosts
- Streams
- Access Lists
- Certificates

## 10. Audit Log

### Übersicht
- **Route**: `/audit-log`
- **API**: `/api/audit-log`
- **Hauptfunktion**: Aktivitätsprotokoll aller Änderungen

### Features
- Chronologische Liste aller Aktionen
- Filterung nach:
  - Benutzer
  - Objekttyp
  - Zeitraum
- Details zu jeder Aktion:
  - Benutzer
  - Zeitstempel
  - Objekttyp und ID
  - Aktion (created, updated, deleted)
  - Änderungen (bei Updates)

## 11. Settings

### Übersicht
- **Route**: `/settings`
- **API**: `/api/settings`
- **Aktuell verfügbare Einstellungen**:

### Default Site
- **404 Page**: Standard-Fehlerseite
- **Redirect**: Weiterleitung zu einer URL
- **Custom Page**: Eigene HTML-Seite
- **Optionen**:
  - "Congratulations" Seite
  - Custom HTML
  - HTTP 444 (Connection Closed Without Response)

## 12. UI/UX Features

### Allgemeine UI-Komponenten
- **Header**:
  - Logo und App-Name
  - Benutzermenü mit Logout
  - Versionsnummer
- **Navigation**:
  - Top-Navigation mit Dropdown-Menüs
  - Icon-basierte Menüpunkte
  - Responsive Design
  - Berechtigungsbasierte Menü-Anzeige

### Tabellen-Features
- Sortierung
- Suche/Filter
- Pagination
- Bulk-Actions
- Inline-Status-Updates

### Formulare
- Client-seitige Validierung
- Echtzeit-Feedback
- Autofocus
- Tab-Navigation
- Tooltips für Hilfe
- Help-Dialoge mit detaillierten Erklärungen
- Domain-Input mit automatischer Trennung (Komma/Space)

### Modals
- Bestätigungs-Dialoge
- Multi-Step-Wizards
- Loading-States
- Error-Handling

### Notifications
- Success-Meldungen
- Error-Meldungen
- Info-Benachrichtigungen
- Auto-Dismiss

## 13. Technische Features

### API-Kommunikation
- RESTful JSON API
- JWT-Authentication
- Request/Response Interceptors
- Error-Handling
- Loading-States

### Cache-Management
- User-Daten
- Zertifikat-Listen
- Host-Konfigurationen
- Automatische Invalidierung

### Real-time Features
- Status-Updates (Online/Offline)
- Token-Refresh
- Session-Timeout-Handling

### Browser-Kompatibilität
- Modern Browser Support
- Mobile Responsive
- Touch-Unterstützung

## 14. Weitere Features

### Error Handling
- Globaler Error Handler für API-Fehler
- Detaillierte Fehlermeldungen bei Debug-Mode
- User-freundliche Fehlermeldungen im Production-Mode
- Stack-Traces für Debugging

### Suchfunktionen
- Inline-Suche in Tabellen
- Filter nach Host-Status
- Domainname-Suche

### Empty States
- Hilfreiche Nachrichten bei leeren Listen
- Call-to-Action Buttons zum Erstellen neuer Einträge
- Berechtigungsbasierte Anzeige von CTAs

### Footer
- Copyright-Hinweis
- GitHub-Link
- Theme-Credits (Tabler)
- Versionsnummer

## 15. Migrations-Hinweise

Bei der Entwicklung eines neuen Frontends sollten folgende Punkte beachtet werden:

### Zu erhaltende Features
- Alle oben genannten Funktionalitäten
- Keyboard-Shortcuts
- Drag & Drop (wo vorhanden)
- Bulk-Operations

### Verbesserungspotential
- Modern UI Framework (React/Vue/Angular)
- TypeScript für Type-Safety
- Bessere Error-Boundaries
- Progressive Web App Features
- Dark Mode
- Erweiterte Filteroptionen
- Dashboard-Customization
- Export/Import-Funktionen
- API-Dokumentation Integration
- Websocket für Real-time Updates

### API-Kompatibilität
- Bestehende API-Endpunkte nutzen
- JWT-Token-Format beibehalten
- Keine Breaking Changes in der API

Diese Dokumentation sollte als vollständige Referenz für die Entwicklung eines neuen Frontends dienen. Alle beschriebenen Features sollten in der neuen Version verfügbar sein, um eine nahtlose Migration zu ermöglichen.