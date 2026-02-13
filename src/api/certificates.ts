import api from './config'
import type { OwnedEntity } from '../types/base'

export interface Certificate extends OwnedEntity {
  provider: 'letsencrypt' | 'other'
  nice_name: string
  domain_names: string[]
  expires_on: string
  meta: {
    letsencrypt_email?: string
    letsencrypt_agree?: boolean
    dns_challenge?: boolean
    dns_provider?: string
    dns_provider_credentials?: string
    propagation_seconds?: number
    certificate_id?: string
  }
}

export interface CreateCertificate {
  provider: 'letsencrypt' | 'other'
  nice_name?: string
  domain_names: string[]
  meta?: {
    letsencrypt_email?: string
    letsencrypt_agree?: boolean
    dns_challenge?: boolean
    dns_provider?: string
    dns_provider_credentials?: string
    propagation_seconds?: number
  }
  // For custom certificates
  certificate?: string
  certificate_key?: string
  intermediate_certificate?: string
}

export interface UpdateCertificate {
  nice_name?: string
  meta?: Certificate['meta']
}

export interface TestDomainReachability {
  domains: string[]
}

export interface RenewCertificate {
  id: number
}

class CertificatesApi {
  async getAll(expand?: string[]): Promise<Certificate[]> {
    const params = expand?.length ? { expand: expand.join(',') } : undefined
    const response = await api.get('/nginx/certificates', { params })
    return response.data
  }

  async getById(id: number, expand?: string[]): Promise<Certificate> {
    const params = expand?.length ? { expand: expand.join(',') } : undefined
    const response = await api.get(`/nginx/certificates/${id}`, { params })
    return response.data
  }

  async create(data: CreateCertificate): Promise<Certificate> {
    const response = await api.post('/nginx/certificates', data)
    return response.data
  }

  async update(id: number, data: UpdateCertificate): Promise<Certificate> {
    const response = await api.put(`/nginx/certificates/${id}`, data)
    return response.data
  }

  async delete(id: number): Promise<boolean> {
    await api.delete(`/nginx/certificates/${id}`)
    return true
  }

  async renew(id: number): Promise<boolean> {
    await api.post(`/nginx/certificates/${id}/renew`)
    return true
  }

  async testHttpReachability(domains: string[]): Promise<{ reachable: boolean; error?: string }> {
    const response = await api.get('/nginx/certificates/test-http', {
      params: { domains: JSON.stringify(domains) }
    })
    return response.data
  }

  async validate(data: CreateCertificate): Promise<{ valid: boolean; error?: string }> {
    const response = await api.post('/nginx/certificates/validate', data)
    return response.data
  }

  async download(id: number): Promise<Blob> {
    const response = await api.get(`/nginx/certificates/${id}/download`, {
      responseType: 'blob'
    })
    return response.data
  }

  async upload(id: number, files: { certificate: File; certificateKey: File; intermediateCertificate?: File }): Promise<Certificate> {
    const formData = new FormData()
    formData.append('certificate', files.certificate)
    formData.append('certificate_key', files.certificateKey)
    if (files.intermediateCertificate) {
      formData.append('intermediate_certificate', files.intermediateCertificate)
    }
    
    const response = await api.post(`/nginx/certificates/${id}/upload`, formData)
    return response.data
  }

  async validateFiles(files: { certificate: File; certificateKey: File; intermediateCertificate?: File }): Promise<{ certificate?: string; certificate_key?: string; valid?: boolean; error?: string }> {
    const formData = new FormData()
    formData.append('certificate', files.certificate)
    formData.append('certificate_key', files.certificateKey)
    if (files.intermediateCertificate) {
      formData.append('intermediate_certificate', files.intermediateCertificate)
    }
    
    const response = await api.post('/nginx/certificates/validate', formData)
    return response.data
  }
}

export const certificatesApi = new CertificatesApi()