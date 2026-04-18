import React from 'react'
import {
  Info as InfoIcon,
  Code as CodeIcon,
  Lock as LockIcon,
} from '@mui/icons-material'
import { ProxyHost, CreateProxyHost, UpdateProxyHost, proxyHostsApi } from '../../../api/proxyHosts'
import { NAVIGATION_CONFIG } from '../../../constants/navigation'
import { LAYOUT } from '../../../constants/layout'
import { AccessList, accessListsApi } from '../../../api/accessLists'
import { Certificate, certificatesApi } from '../../../api/certificates'
import BaseDrawer from '../../base/BaseDrawer'
import TabPanel from '../../shared/TabPanel'
import { useDrawerForm } from '../../../hooks/useDrawerForm'
import { useToast } from '../../../contexts/ToastContext'
import type { ProxyHostFormData } from './proxyHostFormTypes'
import ProxyHostDetailsTab from './ProxyHostDetailsTab'
import ProxyHostSSLTab from './ProxyHostSSLTab'
import ProxyHostAdvancedTab from './ProxyHostAdvancedTab'

interface ProxyHostDrawerProps {
  open: boolean
  onClose: () => void
  host?: ProxyHost | null
  onSave: () => void
}

export default function ProxyHostDrawer({ open, onClose, host, onSave }: ProxyHostDrawerProps) {
  const [activeTab, setActiveTab] = React.useState(0)
  const [accessLists, setAccessLists] = React.useState<AccessList[]>([])
  const [certificates, setCertificates] = React.useState<Certificate[]>([])
  const [loadingData, setLoadingData] = React.useState(false)
  const { showSuccess, showError } = useToast()

  const isEditMode = !!host

  const {
    data,
    setFieldValue,
    loading,
    globalError,
    errors,
    handleSubmit,
    resetForm,
    markAsClean: _markAsClean,
    isDirty,
    isValid: _isValid,
  } = useDrawerForm<ProxyHostFormData>({
    initialData: {
      domainNames: host?.domain_names || [],
      forwardScheme: host?.forward_scheme || 'http',
      forwardHost: host?.forward_host || '',
      forwardPort: host?.forward_port || 80,
      cacheAssets: host?.caching_enabled || false,
      blockExploits: host?.block_exploits || false,
      websocketSupport: host?.allow_websocket_upgrade || false,
      accessListId: host?.access_list_id || 0,
      sslEnabled: (host?.certificate_id || 0) > 0,
      certificateId: host?.certificate_id || 0,
      selectedCertificate: null, // Will be set after certificates load
      forceSSL: host?.ssl_forced || false,
      http2Support: host?.http2_support || false,
      hstsEnabled: host?.hsts_enabled || false,
      hstsSubdomains: host?.hsts_subdomains || false,
      advancedConfig: host?.advanced_config || '',
    },
    validate: (data) => {
      const errors: Partial<Record<keyof ProxyHostFormData, string>> = {}

      // Domain names validation
      if (!data.domainNames || data.domainNames.length === 0) {
        errors.domainNames = 'At least one domain name is required'
      }

      // Forward host validation
      if (!data.forwardHost || data.forwardHost.trim() === '') {
        errors.forwardHost = 'Forward host is required'
      }

      // Forward port validation
      if (!data.forwardPort || data.forwardPort < 1 || data.forwardPort > 65535) {
        errors.forwardPort = 'Port must be between 1 and 65535'
      }

      // SSL certificate validation
      if (data.sslEnabled && !data.certificateId) {
        errors.certificateId = 'SSL certificate is required when SSL is enabled'
      }

      return Object.keys(errors).length > 0 ? errors : null
    },
    onSubmit: async (data) => {
      const payload: CreateProxyHost | UpdateProxyHost = {
        domain_names: data.domainNames,
        forward_scheme: data.forwardScheme,
        forward_host: data.forwardHost,
        forward_port: data.forwardPort,
        caching_enabled: data.cacheAssets,
        block_exploits: data.blockExploits,
        allow_websocket_upgrade: data.websocketSupport,
        access_list_id: data.accessListId || undefined,
        certificate_id: data.sslEnabled ? data.certificateId : undefined,
        ssl_forced: data.sslEnabled && data.forceSSL,
        http2_support: data.sslEnabled && data.http2Support,
        hsts_enabled: data.sslEnabled && data.hstsEnabled,
        hsts_subdomains: data.sslEnabled && data.hstsSubdomains,
        advanced_config: data.advancedConfig,
      }

      if (isEditMode) {
        await proxyHostsApi.update(host.id, payload as UpdateProxyHost)
      } else {
        await proxyHostsApi.create(payload)
      }

      onSave()
      onClose()
    },
    onSuccess: (data) => {
      showSuccess('proxy-host', isEditMode ? 'updated' : 'created', data.domainNames[0] || `#${host?.id || 'new'}`)
    },
    onError: (error) => {
      showError('proxy-host', isEditMode ? 'update' : 'create', error.message, data.domainNames[0])
    }
  })

  // Load access lists and certificates when drawer opens
  React.useEffect(() => {
    if (open) {
      loadSelectorData()
      // Reset form when opening with different host or new host
      resetForm({
        domainNames: host?.domain_names || [],
        forwardScheme: host?.forward_scheme || 'http',
        forwardHost: host?.forward_host || '',
        forwardPort: host?.forward_port || 80,
        cacheAssets: host?.caching_enabled || false,
        blockExploits: host?.block_exploits || false,
        websocketSupport: host?.allow_websocket_upgrade || false,
        accessListId: host?.access_list_id || 0,
        sslEnabled: (host?.certificate_id || 0) > 0,
        certificateId: host?.certificate_id || 0,
        selectedCertificate: null,
        forceSSL: host?.ssl_forced || false,
        http2Support: host?.http2_support || false,
        hstsEnabled: host?.hsts_enabled || false,
        hstsSubdomains: host?.hsts_subdomains || false,
        advancedConfig: host?.advanced_config || '',
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- loadSelectorData is stable and only needs to run when drawer opens
  }, [open, host, resetForm])

  // Set selected certificate after certificates load
  React.useEffect(() => {
    if (data.certificateId && certificates.length > 0) {
      const cert = certificates.find(c => c.id === data.certificateId)
      if (cert && cert !== data.selectedCertificate) {
        setFieldValue('selectedCertificate', cert)
      }
    }
  }, [data.certificateId, certificates, data.selectedCertificate, setFieldValue])

  const loadSelectorData = async () => {
    try {
      setLoadingData(true)
      const [accessListsData, certificatesData] = await Promise.all([
        accessListsApi.getAll(),
        certificatesApi.getAll()
      ])
      setAccessLists(accessListsData)

      // Sort certificates by name
      const sortedCertificates = [...certificatesData].sort((a, b) => {
        const nameA = a.nice_name || a.domain_names[0] || ''
        const nameB = b.nice_name || b.domain_names[0] || ''
        return nameA.localeCompare(nameB)
      })

      setCertificates(sortedCertificates)
    } catch (err: unknown) {
      showError('proxy-host', 'load data', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoadingData(false)
    }
  }

  const tabs = React.useMemo(() => {
    // Check which fields belong to which tab
    const detailsErrors = ['domainNames', 'forwardHost', 'forwardPort', 'accessListId'];
    const sslErrors = ['certificateId'];

    const hasDetailsError = detailsErrors.some(field => errors[field as keyof ProxyHostFormData]);
    const hasSslError = data.sslEnabled && sslErrors.some(field => errors[field as keyof ProxyHostFormData]);

    return [
      {
        id: 'details',
        label: 'Details',
        icon: <InfoIcon />,
        hasError: hasDetailsError
      },
      {
        id: 'ssl',
        label: 'SSL',
        icon: <LockIcon />,
        badge: data.sslEnabled ? 1 : 0,
        hasError: hasSslError
      },
      {
        id: 'advanced',
        label: 'Advanced',
        icon: <CodeIcon />
      },
    ];
  }, [data.sslEnabled, errors])

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={isEditMode ? 'Edit Proxy Host' : 'New Proxy Host'}
      titleIcon={React.createElement(NAVIGATION_CONFIG.proxyHosts.icon, { sx: { color: NAVIGATION_CONFIG.proxyHosts.color } })}
      subtitle={data.domainNames?.[0] || 'Proxy host configuration'}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      loading={loading}
      error={globalError || undefined}
      isDirty={isDirty}
      onSave={handleSubmit}
      saveDisabled={false}
      saveText={isEditMode ? 'Save Changes' : 'Create'}
      confirmClose={isDirty}
      width={LAYOUT.DRAWER_PANEL_WIDTH}
    >
      <TabPanel value={activeTab} index={0} keepMounted animation="none">
        <ProxyHostDetailsTab
          data={data}
          setFieldValue={setFieldValue}
          errors={errors}
          accessLists={accessLists}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1} keepMounted animation="none">
        <ProxyHostSSLTab
          data={data}
          setFieldValue={setFieldValue}
          errors={errors}
          certificates={certificates}
          loadingData={loadingData}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={2} keepMounted animation="none">
        <ProxyHostAdvancedTab
          data={data}
          setFieldValue={setFieldValue}
        />
      </TabPanel>
    </BaseDrawer>
  )
}
