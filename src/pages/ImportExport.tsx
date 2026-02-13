import { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
} from '@mui/material'
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Description as FileIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material'
import ImportDialog from '../components/ImportDialog'
import ExportDialog from '../components/ExportDialog'
import { proxyHostsApi } from '../api/proxyHosts'
import { redirectionHostsApi } from '../api/redirectionHosts'
import { deadHostsApi } from '../api/deadHosts'
import { streamsApi } from '../api/streams'
import { certificatesApi } from '../api/certificates'
import { accessListsApi } from '../api/accessLists'
import logger from '../utils/logger'

export default function ImportExport() {
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportItems, setExportItems] = useState<any[]>([])
  const [exportItemType, setExportItemType] = useState('')
  const [exportTypeName, setExportTypeName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleExportAll = async () => {
    setLoading(true)
    try {
      // Fetch all data
      const [proxyHosts, redirectionHosts, deadHosts, streams, certificates, accessLists] = await Promise.all([
        proxyHostsApi.getAll(),
        redirectionHostsApi.getAll(),
        deadHostsApi.getAll(),
        streamsApi.getAll(),
        certificatesApi.getAll(),
        accessListsApi.getAll(),
      ])

      // Create bundle
      const allItems = {
        proxy_hosts: proxyHosts,
        redirection_hosts: redirectionHosts,
        dead_hosts: deadHosts,
        streams: streams,
        certificates: certificates,
        access_lists: accessLists,
      }

      setExportItems([allItems])
      setExportItemType('bundle')
      setExportTypeName('All Configurations')
      setExportDialogOpen(true)
    } catch (error) {
      logger.error('Failed to fetch data for export:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportByType = async (type: string) => {
    setLoading(true)
    try {
      let items: any[] = []
      let itemType = ''
      let typeName = ''

      switch (type) {
        case 'proxy':
          items = await proxyHostsApi.getAll()
          itemType = 'proxy_host'
          typeName = 'Proxy Hosts'
          break
        case 'redirection':
          items = await redirectionHostsApi.getAll()
          itemType = 'redirection_host'
          typeName = 'Redirection Hosts'
          break
        case 'dead':
          items = await deadHostsApi.getAll()
          itemType = 'dead_host'
          typeName = '404 Hosts'
          break
        case 'stream':
          items = await streamsApi.getAll()
          itemType = 'stream'
          typeName = 'Streams'
          break
        case 'certificate':
          items = await certificatesApi.getAll()
          itemType = 'certificate'
          typeName = 'Certificates'
          break
        case 'access':
          items = await accessListsApi.getAll()
          itemType = 'access_list'
          typeName = 'Access Lists'
          break
      }

      setExportItems(items)
      setExportItemType(itemType)
      setExportTypeName(typeName)
      setExportDialogOpen(true)
    } catch (error) {
      logger.error('Failed to fetch data for export:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportOptions = [
    {
      type: 'all',
      title: 'Export All',
      description: 'Export all configurations including hosts, certificates, and access lists',
      icon: <ArchiveIcon fontSize="large" />,
      color: 'primary' as const,
    },
    {
      type: 'proxy',
      title: 'Proxy Hosts',
      description: 'Export all proxy host configurations',
      icon: <FileIcon />,
    },
    {
      type: 'redirection',
      title: 'Redirection Hosts',
      description: 'Export all redirection host configurations',
      icon: <FileIcon />,
    },
    {
      type: 'dead',
      title: '404 Hosts',
      description: 'Export all 404 host configurations',
      icon: <FileIcon />,
    },
    {
      type: 'stream',
      title: 'Streams',
      description: 'Export all stream configurations',
      icon: <FileIcon />,
    },
    {
      type: 'certificate',
      title: 'Certificates',
      description: 'Export all certificate configurations',
      icon: <FileIcon />,
    },
    {
      type: 'access',
      title: 'Access Lists',
      description: 'Export all access list configurations',
      icon: <FileIcon />,
    },
  ]

  return (
    <Container maxWidth="lg">
      <title>Import &amp; Export - NPMDeck</title>
      <Box sx={{
        py: 3
      }}>
        <Typography variant="h4" gutterBottom>
          Import / Export
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            marginBottom: "16px"
          }}>
          Backup, restore, and migrate your Nginx Proxy Manager configurations
        </Typography>

        <Grid container spacing={3}>
          {/* Import Section */}
          <Grid size={12}>
            <Paper sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 2
                }}>
                <RestoreIcon color="primary" />
                <Typography variant="h5">Import Configuration</Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  marginBottom: "16px"
                }}>
                Import configurations from a previously exported JSON file. You can import individual hosts, 
                certificates, or complete configuration bundles.
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Imported items will be created as new entries. Existing configurations will not be overwritten 
                unless you explicitly choose to do so during the import process.
              </Alert>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => setImportDialogOpen(true)}
                size="large"
              >
                Import Configuration
              </Button>
            </Paper>
          </Grid>

          {/* Export Section */}
          <Grid size={12}>
            <Paper sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 2
                }}>
                <BackupIcon color="primary" />
                <Typography variant="h5">Export Configuration</Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  marginBottom: "16px"
                }}>
                Export your configurations for backup or migration purposes. Choose to export everything 
                or select specific types of configurations.
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                {exportOptions.map((option) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={option.type}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mb: 1
                          }}>
                          {option.icon}
                          <Typography variant="h6">{option.title}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{
                          color: "text.secondary"
                        }}>
                          {option.description}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button
                          fullWidth
                          variant={option.type === 'all' ? 'contained' : 'outlined'}
                          color={option.color}
                          startIcon={<DownloadIcon />}
                          onClick={() => {
                            if (option.type === 'all') {
                              handleExportAll()
                            } else {
                              handleExportByType(option.type)
                            }
                          }}
                          disabled={loading}
                        >
                          Export
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* Templates Section */}
          <Grid size={12}>
            <Paper sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 2
                }}>
                <FileIcon color="primary" />
                <Typography variant="h5">Configuration Templates</Typography>
              </Box>
              <Alert severity="info">
                Configuration templates feature coming soon! This will allow you to save and reuse 
                common configuration patterns.
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      {/* Dialogs */}
      <ImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImportComplete={() => {
          setImportDialogOpen(false)
          // Could refresh data or show success message here
        }}
      />
      {exportDialogOpen && (
        <ExportDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          items={exportItems}
          type={exportItemType as 'proxy_host' | 'redirection_host' | 'dead_host' | 'stream' | 'certificate' | 'access_list' | 'bundle'}
          itemName={exportTypeName}
        />
      )}
    </Container>
  );
}