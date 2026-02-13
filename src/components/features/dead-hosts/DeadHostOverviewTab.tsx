import { Grid } from '@mui/material'
import { DeadHost } from '../../../api/deadHosts'
import StatusOverviewPanel from './StatusOverviewPanel'
import BasicInfoPanel from './BasicInfoPanel'
import DomainNamesPanel from './DomainNamesPanel'
import ConfigurationPanel from './ConfigurationPanel'
import SslCertificatePanel from './SslCertificatePanel'
import NginxErrorPanel from './NginxErrorPanel'

interface DeadHostOverviewTabProps {
  host: DeadHost
  onCopyToClipboard: (text: string, label?: string) => void
  onNavigateToCertificate: () => void
}

/** Container component that renders all sub-panels for the dead host overview tab */
const DeadHostOverviewTab = ({
  host,
  onCopyToClipboard,
  onNavigateToCertificate,
}: DeadHostOverviewTabProps) => {
  return (
    <>
      <StatusOverviewPanel host={host} />

      <Grid container spacing={3}>
        <BasicInfoPanel host={host} onCopyToClipboard={onCopyToClipboard} />

        <DomainNamesPanel
          domainNames={host.domain_names}
          onCopyToClipboard={onCopyToClipboard}
        />

        <ConfigurationPanel host={host} />

        <SslCertificatePanel
          host={host}
          onNavigateToCertificate={onNavigateToCertificate}
        />

        <NginxErrorPanel host={host} />
      </Grid>
    </>
  )
}

export default DeadHostOverviewTab