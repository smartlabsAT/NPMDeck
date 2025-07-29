import { ProxyHost } from '../api/proxyHosts'
import { RedirectionHost } from '../api/redirectionHosts'
import { DeadHost } from '../api/deadHosts'
import { Stream } from '../api/streams'
import { Certificate } from '../api/certificates'
import { AccessList } from '../api/accessLists'
import { ImportValidationData } from '../types/common'

export type ExportType = 'proxy_host' | 'redirection_host' | 'dead_host' | 'stream' | 'certificate' | 'access_list' | 'bundle'

export interface ExportMetadata {
  version: string
  exported_at: string
  type: ExportType
  npm_version?: string
  export_source: string
}

export interface ExportData<T = ProxyHost | RedirectionHost | DeadHost | Stream | Certificate | AccessList> {
  version: string
  exported_at: string
  type: ExportType
  data: T | T[]
  metadata: ExportMetadata
}

export interface ImportOptions {
  overwriteExisting?: boolean
  skipExisting?: boolean
  renameOnConflict?: boolean
  includeSensitiveData?: boolean
}

export interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  failed: number
  errors: string[]
}

export class ImportExportService {
  private static readonly CURRENT_VERSION = '1.0'
  private static readonly EXPORT_SOURCE = 'nginx-proxy-manager-frontend'

  // Export single item
  static exportItem<T extends ProxyHost | RedirectionHost | DeadHost | Stream | Certificate | AccessList>(
    item: T,
    type: ExportType,
    options?: { includeSensitiveData?: boolean }
  ): ExportData<T> {
    const cleanedItem = this.cleanSensitiveData(item, type, options?.includeSensitiveData)
    
    return {
      version: this.CURRENT_VERSION,
      exported_at: new Date().toISOString(),
      type,
      data: cleanedItem,
      metadata: {
        version: this.CURRENT_VERSION,
        exported_at: new Date().toISOString(),
        type,
        export_source: this.EXPORT_SOURCE
      }
    }
  }

  // Export multiple items
  static exportItems<T extends ProxyHost | RedirectionHost | DeadHost | Stream | Certificate | AccessList>(
    items: T[],
    type: ExportType,
    options?: { includeSensitiveData?: boolean }
  ): ExportData<T[]> {
    const cleanedItems = items.map(item => 
      this.cleanSensitiveData(item, type, options?.includeSensitiveData)
    )
    
    return {
      version: this.CURRENT_VERSION,
      exported_at: new Date().toISOString(),
      type,
      data: cleanedItems,
      metadata: {
        version: this.CURRENT_VERSION,
        exported_at: new Date().toISOString(),
        type,
        export_source: this.EXPORT_SOURCE
      }
    }
  }

  // Download export as file
  static downloadExport(exportData: ExportData, filename?: string) {
    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const defaultFilename = `npm-export-${exportData.type}-${Date.now()}.json`
    const a = document.createElement('a')
    a.href = url
    a.download = filename || defaultFilename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Validate import data
  static validateImportData(data: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data || typeof data !== 'object') {
      errors.push('Invalid data format')
      return { valid: false, errors }
    }

    const validatedData = data as ImportValidationData

    if (!validatedData.version) {
      errors.push('Missing version field')
    }

    if (!validatedData.type) {
      errors.push('Missing type field')
    }

    if (!validatedData.data) {
      errors.push('Missing data field')
    }

    if (!validatedData.exported_at) {
      errors.push('Missing exported_at field')
    }

    // Version compatibility check
    if (validatedData.version && !this.isVersionCompatible(validatedData.version)) {
      errors.push(`Incompatible version: ${validatedData.version}. Current version: ${this.CURRENT_VERSION}`)
    }

    return { valid: errors.length === 0, errors }
  }

  // Parse import file
  static async parseImportFile(file: File): Promise<ExportData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)
          const validation = this.validateImportData(data)
          
          if (!validation.valid) {
            reject(new Error(`Import validation failed: ${validation.errors.join(', ')}`))
            return
          }
          
          resolve(data)
        } catch (error) {
          reject(new Error(`Failed to parse import file: ${error}`))
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  // Clean sensitive data from export
  private static cleanSensitiveData<T>(item: T, type: ExportType, includeSensitive = false): T {
    if (includeSensitive) {
      return item
    }

    const cleaned = { ...item } as Record<string, unknown>

    // Remove common sensitive fields
    delete cleaned.id
    delete cleaned.created_on
    delete cleaned.modified_on
    delete cleaned.owner_user_id
    delete cleaned.owner

    // Type-specific cleaning
    switch (type) {
      case 'certificate':
        // Never export private keys
        delete (cleaned as any).meta?.certificate_key
        delete (cleaned as any).certificate_key
        break
        
      case 'access_list':
        // Optionally remove passwords
        if (cleaned.items && Array.isArray(cleaned.items)) {
          cleaned.items = cleaned.items.map((item: Record<string, unknown>) => ({
            ...item,
            password: includeSensitive ? item.password : '<REDACTED>'
          }))
        }
        break
        
      case 'proxy_host':
      case 'redirection_host':
      case 'dead_host':
      case 'stream':
        // Remove nginx status
        delete (cleaned as any).meta?.nginx_online
        delete (cleaned as any).meta?.nginx_err
        break
    }

    return cleaned as T
  }

  // Check version compatibility
  private static isVersionCompatible(version: string): boolean {
    // Simple check for now, can be expanded for migration support
    const [major] = version.split('.')
    const [currentMajor] = this.CURRENT_VERSION.split('.')
    return major === currentMajor
  }

  // Prepare item for import (remove/transform fields as needed)
  static prepareForImport<T>(item: T, type: ExportType): Partial<T> {
    const prepared = { ...item } as Record<string, unknown>

    // Remove fields that should not be imported
    delete prepared.id
    delete prepared.created_on
    delete prepared.modified_on
    delete prepared.owner_user_id
    delete prepared.owner
    delete (prepared as any).meta?.nginx_online
    delete (prepared as any).meta?.nginx_err

    // Ensure required fields have default values if missing
    switch (type) {
      case 'proxy_host':
        prepared.enabled = prepared.enabled ?? true
        prepared.locations = prepared.locations || []
        break
        
      case 'redirection_host':
        prepared.enabled = prepared.enabled ?? true
        prepared.preserve_path = prepared.preserve_path ?? true
        break
        
      case 'dead_host':
        prepared.enabled = prepared.enabled ?? true
        break
        
      case 'stream':
        prepared.enabled = prepared.enabled ?? true
        prepared.tcp_forwarding = prepared.tcp_forwarding ?? true
        prepared.udp_forwarding = prepared.udp_forwarding ?? false
        break
        
      case 'certificate':
        // Certificates might need special handling
        break
        
      case 'access_list':
        prepared.satisfy_any = prepared.satisfy_any ?? false
        prepared.pass_auth = prepared.pass_auth ?? false
        // Clean items and clients to ensure they don't have IDs
        if (prepared.items && Array.isArray(prepared.items)) {
          prepared.items = prepared.items.map((item: Record<string, unknown>) => ({
            username: item.username,
            password: item.password || ''
          }))
        }
        if (prepared.clients && Array.isArray(prepared.clients)) {
          prepared.clients = prepared.clients.map((client: Record<string, unknown>) => ({
            address: client.address,
            directive: client.directive
          }))
        }
        break
    }

    return prepared as Partial<T>
  }
}