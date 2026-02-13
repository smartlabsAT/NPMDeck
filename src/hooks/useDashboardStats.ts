import { useState, useEffect } from 'react'
import { proxyHostsApi } from '../api/proxyHosts'
import type { ProxyHost } from '../api/proxyHosts'
import { redirectionHostsApi } from '../api/redirectionHosts'
import type { RedirectionHost } from '../api/redirectionHosts'
import { deadHostsApi } from '../api/deadHosts'
import type { DeadHost } from '../api/deadHosts'
import { streamsApi } from '../api/streams'
import type { Stream } from '../api/streams'
import { certificatesApi, Certificate } from '../api/certificates'
import { accessListsApi } from '../api/accessLists'
import type { AccessList } from '../api/accessLists'
import { usePermissions } from './usePermissions'
import { getDaysUntilExpiry } from '../utils/dateUtils'
import logger from '../utils/logger'

export interface DashboardStats {
  proxyHosts: {
    total: number
    active: number
    inactive: number
  }
  redirectionHosts: {
    total: number
    active: number
    inactive: number
  }
  deadHosts: {
    total: number
    active: number
    inactive: number
  }
  streams: {
    total: number
    active: number
    inactive: number
  }
  certificates: {
    total: number
    valid: number
    expiringSoon: number
    expired: number
  }
  accessLists: {
    total: number
  }
  expiringCertificates: Certificate[]
  loading: boolean
  error: string | null
}

export const useDashboardStats = () => {
  const { canView } = usePermissions()
  const [stats, setStats] = useState<DashboardStats>({
    proxyHosts: { total: 0, active: 0, inactive: 0 },
    redirectionHosts: { total: 0, active: 0, inactive: 0 },
    deadHosts: { total: 0, active: 0, inactive: 0 },
    streams: { total: 0, active: 0, inactive: 0 },
    certificates: { total: 0, valid: 0, expiringSoon: 0, expired: 0 },
    accessLists: { total: 0 },
    expiringCertificates: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }))
        
        const results = await Promise.allSettled([
          canView('proxy_hosts') ? proxyHostsApi.getAll() : Promise.resolve([]),
          canView('redirection_hosts') ? redirectionHostsApi.getAll() : Promise.resolve([]),
          canView('dead_hosts') ? deadHostsApi.getAll() : Promise.resolve([]),
          canView('streams') ? streamsApi.getAll() : Promise.resolve([]),
          canView('certificates') ? certificatesApi.getAll() : Promise.resolve([]),
          canView('access_lists') ? accessListsApi.getAll() : Promise.resolve([])
        ])

        const [proxyHosts, redirectionHosts, deadHosts, streams, certificates, accessLists] = results.map(
          result => result.status === 'fulfilled' ? result.value : []
        ) as [ProxyHost[], RedirectionHost[], DeadHost[], Stream[], Certificate[], AccessList[]]

        // Process proxy hosts
        const proxyStats = {
          total: proxyHosts.length,
          active: proxyHosts.filter(h => h.enabled).length,
          inactive: proxyHosts.filter(h => !h.enabled).length
        }

        // Process redirection hosts
        const redirectionStats = {
          total: redirectionHosts.length,
          active: redirectionHosts.filter(h => h.enabled).length,
          inactive: redirectionHosts.filter(h => !h.enabled).length
        }

        // Process dead hosts
        const deadStats = {
          total: deadHosts.length,
          active: deadHosts.filter(h => h.enabled).length,
          inactive: deadHosts.filter(h => !h.enabled).length
        }

        // Process streams
        const streamStats = {
          total: streams.length,
          active: streams.filter(s => s.enabled).length,
          inactive: streams.filter(s => !s.enabled).length
        }

        // Process certificates
        const expiringCerts: Certificate[] = []
        let validCount = 0
        let expiringSoonCount = 0
        let expiredCount = 0

        certificates.forEach((cert: Certificate) => {
          const days = getDaysUntilExpiry(cert.expires_on)
          if (days === null) return
          
          if (days < 0) {
            expiredCount++
          } else if (days <= 30) {
            expiringSoonCount++
            expiringCerts.push(cert)
          } else {
            validCount++
          }
        })

        // Sort expiring certificates by days remaining
        expiringCerts.sort((a, b) => {
          const daysA = getDaysUntilExpiry(a.expires_on) || 0
          const daysB = getDaysUntilExpiry(b.expires_on) || 0
          return daysA - daysB
        })

        const certStats = {
          total: certificates.length,
          valid: validCount,
          expiringSoon: expiringSoonCount,
          expired: expiredCount
        }

        setStats({
          proxyHosts: proxyStats,
          redirectionHosts: redirectionStats,
          deadHosts: deadStats,
          streams: streamStats,
          certificates: certStats,
          accessLists: { total: accessLists.length },
          expiringCertificates: expiringCerts,
          loading: false,
          error: null
        })
      } catch (error) {
        logger.error('Failed to fetch dashboard stats:', error)
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load statistics'
        }))
      }
    }

    fetchStats()
  }, [canView])

  return stats
}