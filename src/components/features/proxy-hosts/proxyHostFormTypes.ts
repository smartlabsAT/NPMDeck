import { Certificate } from '../../../api/certificates'

export interface ProxyHostFormData {
  domainNames: string[]
  forwardScheme: 'http' | 'https'
  forwardHost: string
  forwardPort: number
  cacheAssets: boolean
  blockExploits: boolean
  websocketSupport: boolean
  accessListId: number
  sslEnabled: boolean
  certificateId: number
  selectedCertificate: Certificate | null
  forceSSL: boolean
  http2Support: boolean
  hstsEnabled: boolean
  hstsSubdomains: boolean
  advancedConfig: string
}
