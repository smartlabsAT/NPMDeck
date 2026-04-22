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
