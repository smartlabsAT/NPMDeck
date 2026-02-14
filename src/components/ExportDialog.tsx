import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Alert,
  TextField,
  Chip,
  FormGroup,
  Divider,
} from '@mui/material'
import {
  Download as DownloadIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material'
import { ImportExportService, ExportType, ExportData } from '../services/importExport'
import { NAVIGATION_COLORS } from '../constants/navigation'
import logger from '../utils/logger'

/**
 * Helper type for items that may have domain_names for display
 */
interface HasDomainNames {
  domain_names: string[]
}

/** Entity types that the ImportExportService can export */
type ServiceEntity = Parameters<typeof ImportExportService.exportItem>[0]

/**
 * Items accepted by the ExportDialog. Allows ServiceEntity types
 * as well as broader objects (e.g. export bundles) that share a common base.
 */
type ExportableItem = ServiceEntity | { [key: string]: unknown }

interface ExportDialogProps {
  open: boolean
  onClose: () => void
  items: ExportableItem[]
  type: ExportType
  itemName: string // e.g., "Proxy Host", "Certificate"
}

export default function ExportDialog({ 
  open, 
  onClose, 
  items, 
  type, 
  itemName 
}: ExportDialogProps) {
  const [includeSensitiveData, setIncludeSensitiveData] = useState(false)
  const [filename, setFilename] = useState('')
  const [exportFields, setExportFields] = useState({
    basicConfig: true,
    sslConfig: true,
    advancedConfig: true,
    metadata: false,
  })

  const isSingleItem = items.length === 1
  const itemCount = items.length

  const handleExport = () => {
    try {
      const serviceItems = items as ServiceEntity[]
      const exportData = isSingleItem
        ? ImportExportService.exportItem(serviceItems[0], type, { includeSensitiveData })
        : ImportExportService.exportItems(serviceItems, type, { includeSensitiveData })

      const firstItem = items[0]
      const domainNames = 'domain_names' in firstItem ? (firstItem as HasDomainNames).domain_names : undefined
      const defaultFilename = isSingleItem && domainNames
        ? `${type}-${domainNames[0].replace(/[^a-z0-9]/gi, '-')}.json`
        : `${type}-export-${itemCount}-items.json`

      ImportExportService.downloadExport(exportData as ExportData, filename || defaultFilename)
      onClose()
    } catch (error) {
      logger.error('Export failed:', error)
    }
  }

  const getSensitiveFields = () => {
    switch (type) {
      case 'certificate':
        return ['Private keys', 'Certificate keys']
      case 'access_list':
        return ['User passwords', 'Authentication credentials']
      case 'proxy_host':
      case 'redirection_host':
      case 'dead_host':
        return ['Owner information', 'Internal IDs']
      default:
        return ['Sensitive configuration data']
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1
          }}>
          <FileDownloadIcon sx={{ color: NAVIGATION_COLORS.info }} />
          Export {itemName}{isSingleItem ? '' : `s (${itemCount} items)`}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Export info */}
          <Alert severity="info" icon={<InfoIcon />}>
            Export your {itemName.toLowerCase()} configuration{isSingleItem ? '' : 's'} as JSON 
            for backup, sharing, or migration purposes.
          </Alert>

          {/* Single item details */}
          {isSingleItem && 'domain_names' in items[0] && (items[0] as Partial<HasDomainNames>).domain_names && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Exporting:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(items[0] as HasDomainNames).domain_names.map((domain: string) => (
                  <Chip key={domain} label={domain} size="small" />
                ))}
              </Box>
            </Box>
          )}

          {/* Export options */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Export Options
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportFields.basicConfig}
                    onChange={(e) => setExportFields({ ...exportFields, basicConfig: e.target.checked })}
                  />
                }
                label="Basic Configuration"
              />
              {(type === 'proxy_host' || type === 'redirection_host' || type === 'dead_host') && (
                <>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={exportFields.sslConfig}
                        onChange={(e) => setExportFields({ ...exportFields, sslConfig: e.target.checked })}
                      />
                    }
                    label="SSL Configuration"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={exportFields.advancedConfig}
                        onChange={(e) => setExportFields({ ...exportFields, advancedConfig: e.target.checked })}
                      />
                    }
                    label="Advanced Configuration"
                  />
                </>
              )}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportFields.metadata}
                    onChange={(e) => setExportFields({ ...exportFields, metadata: e.target.checked })}
                  />
                }
                label="Metadata (creation date, owner)"
              />
            </FormGroup>
          </Box>

          <Divider />

          {/* Sensitive data warning */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeSensitiveData}
                  onChange={(e) => setIncludeSensitiveData(e.target.checked)}
                  color="warning"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="warning" fontSize="small" />
                  <Typography>Include sensitive data</Typography>
                </Box>
              }
            />
            {includeSensitiveData && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                <Typography variant="body2" gutterBottom>
                  This will include:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {getSensitiveFields().map((field, index) => (
                    <li key={index}><Typography variant="body2">{field}</Typography></li>
                  ))}
                </ul>
              </Alert>
            )}
          </Box>

          {/* Filename */}
          <TextField
            label="Filename (optional)"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder={`${type}-export.json`}
            fullWidth
            helperText="Leave empty for automatic filename"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleExport}
          variant="contained"
          startIcon={<DownloadIcon />}
        >
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
}