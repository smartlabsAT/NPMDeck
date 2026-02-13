import React, { useState, useEffect } from 'react'
import {
  Button,
  Typography,
  Box,
  Alert,
  Paper,
  Tabs,
  Tab,
} from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Edit as EditIcon,
  Block as BlockIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { DeadHost } from '../api/deadHosts'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'
// import ExportDialog from './ExportDialog'
import AdaptiveContainer from './AdaptiveContainer'
import TabPanel from './shared/TabPanel'
import { NAVIGATION_COLORS } from '../constants/navigation'
import DeadHostOverviewTab from './features/dead-hosts/DeadHostOverviewTab'

interface DeadHostDetailsDialogProps {
  open: boolean
  onClose: () => void
  host: DeadHost | null
  onEdit?: (host: DeadHost) => void
}

const DeadHostDetailsDialog = ({
  open,
  onClose,
  host,
  onEdit,
}: DeadHostDetailsDialogProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(0)
  const { copiedText, copyToClipboard } = useCopyToClipboard()
  // const [exportDialogOpen, setExportDialogOpen] = useState(false)

  // Parse tab from URL
  useEffect(() => {
    if (open && host) {
      const pathParts = location.pathname.split('/')
      const tabIndex = pathParts[pathParts.length - 1]
      switch (tabIndex) {
        case 'advanced':
          setActiveTab(1)
          break
        default:
          setActiveTab(0)
          break
      }
    }
  }, [location.pathname, open, host])

  if (!host) return null

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    if (host) {
      const tabs = ['overview', 'advanced']
      navigate(`/hosts/404/${host.id}/view/${tabs[newValue]}`, { replace: true })
    }
  }

  return (
    <AdaptiveContainer
      open={open}
      onClose={onClose}
      entity="dead_hosts"
      operation="view"
      title={
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <BlockIcon sx={{ color: NAVIGATION_COLORS.danger }} />
            <Typography variant="h6">404 Host</Typography>
          </Box>
          <Typography variant="body2" sx={{
            color: "text.secondary"
          }}>
            {host.domain_names.join(', ') || 'Details'}
          </Typography>
        </Box>
      }
      maxWidth="md"
      fullWidth
      actions={
        <>
          {/* <Button
            onClick={() => setExportDialogOpen(true)}
            startIcon={<DownloadIcon />}
          >
            Export
          </Button> */}
          {onEdit && (
            <Button 
              onClick={() => {
                onClose()
                onEdit(host)
              }}
              startIcon={<EditIcon />}
              color="primary"
            >
              Edit 404 Host
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </>
      }
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="dead host details tabs">
          <Tab label="Overview" icon={<InfoIcon />} iconPosition="start" />
          <Tab label="Advanced" icon={<SettingsIcon />} iconPosition="start" />
        </Tabs>
      </Box>
      <Box sx={{ overflow: 'auto' }}>
        {copiedText && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Copied {copiedText} to clipboard!
          </Alert>
        )}

        <TabPanel value={activeTab} index={0} animation="none" padding={0} sx={{ py: 2 }}>
          <DeadHostOverviewTab
            host={host}
            onCopyToClipboard={copyToClipboard}
            onNavigateToCertificate={() => {
              onClose()
              navigate(`/security/certificates/${host.certificate_id}/view`)
            }}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1} animation="none" padding={0} sx={{ py: 2 }}>
          {/* Advanced Tab */}
          {host.advanced_config ? (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{
                  color: "text.secondary",
                  fontWeight: "bold"
                }}>
                Custom Nginx Configuration
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "monospace",
                  whiteSpace: 'pre-wrap',
                  backgroundColor: 'background.default',
                  p: 2,
                  borderRadius: 1,
                  mt: 1
                }}>
                {host.advanced_config}
              </Typography>
            </Paper>
          ) : (
            <Alert severity="info">
              No custom Nginx configuration defined for this 404 host.
            </Alert>
          )}
        </TabPanel>
      </Box>
      {/* Export Dialog */}
      {/* {host && (
        <ExportDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          items={[host]}
          type="dead_host"
          itemName="404 Host"
        />
      )} */}
    </AdaptiveContainer>
  );
}

export default DeadHostDetailsDialog