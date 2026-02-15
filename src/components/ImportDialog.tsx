import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  CircularProgress,
  IconButton,
} from '@mui/material'
import {
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Description as FileIcon,
  FileUpload as FileUploadIcon,
} from '@mui/icons-material'
import { useDropzone } from 'react-dropzone'
import { ImportExportService, ExportData, ImportOptions } from '../services/importExport'
import { proxyHostsApi } from '../api/proxyHosts'
import { redirectionHostsApi } from '../api/redirectionHosts'
import { deadHostsApi } from '../api/deadHosts'
import { streamsApi } from '../api/streams'
import { certificatesApi } from '../api/certificates'
import { accessListsApi } from '../api/accessLists'
import { getErrorMessage } from '../types/common'
import { ProxyHost, CreateProxyHost } from '../api/proxyHosts'
import { RedirectionHost, CreateRedirectionHost } from '../api/redirectionHosts'
import { DeadHost, CreateDeadHost } from '../api/deadHosts'
import { Stream, CreateStream } from '../api/streams'
import { Certificate, CreateCertificate } from '../api/certificates'
import { AccessList, CreateAccessList } from '../api/accessLists'
import { NAVIGATION_COLORS } from '../constants/navigation'

interface ImportDialogProps {
  open: boolean
  onClose: () => void
  onImportComplete: () => void
}

const steps = ['Upload File', 'Preview & Configure', 'Import']

export default function ImportDialog({ open, onClose, onImportComplete }: ImportDialogProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<ExportData | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    overwriteExisting: false,
    skipExisting: true,
    renameOnConflict: false,
  })
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<{
    success: number
    failed: number
    errors: string[]
  }>({ success: 0, failed: 0, errors: [] })
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setFile(file)
      setValidationErrors([])
      
      try {
        const data = await ImportExportService.parseImportFile(file)
        setImportData(data)
        
        // Select all items by default
        const itemCount = Array.isArray(data.data) ? data.data.length : 1
        setSelectedItems(new Set(Array.from({ length: itemCount }, (_, i) => i)))
        
        setActiveStep(1)
      } catch (error: unknown) {
        setValidationErrors([getErrorMessage(error)])
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    multiple: false
  })

  const handleImport = async () => {
    if (!importData) return

    setImporting(true)
    setActiveStep(2)
    
    const results = { success: 0, failed: 0, errors: [] as string[] }
    const items = Array.isArray(importData.data) ? importData.data : [importData.data]
    
    for (let i = 0; i < items.length; i++) {
      if (!selectedItems.has(i)) continue
      
      try {
        const item = ImportExportService.prepareForImport(items[i], importData.type)
        
        switch (importData.type) {
          case 'proxy_host':
            await proxyHostsApi.create(item as CreateProxyHost)
            break
          case 'redirection_host':
            await redirectionHostsApi.create(item as CreateRedirectionHost)
            break
          case 'dead_host':
            await deadHostsApi.create(item as CreateDeadHost)
            break
          case 'stream':
            await streamsApi.create(item as CreateStream)
            break
          case 'certificate':
            await certificatesApi.create(item as CreateCertificate)
            break
          case 'access_list':
            await accessListsApi.create(item as CreateAccessList)
            break
        }
        
        results.success++
      } catch (error: unknown) {
        results.failed++
        const errorMsg = getErrorMessage(error)
        results.errors.push(`Item ${i + 1}: ${errorMsg}`)
      }
    }
    
    setImportResults(results)
    setImporting(false)
  }

  const handleClose = () => {
    if (importResults.success > 0) {
      onImportComplete()
    }
    setActiveStep(0)
    setFile(null)
    setImportData(null)
    setSelectedItems(new Set())
    setImportResults({ success: 0, failed: 0, errors: [] })
    setValidationErrors([])
    onClose()
  }

  const getItemDisplayName = (item: ProxyHost | RedirectionHost | DeadHost | Stream | Certificate | AccessList, index: number) => {
    if ('domain_names' in item && item.domain_names?.length > 0) {
      return item.domain_names.join(', ')
    }
    if ('name' in item && item.name) {
      return item.name
    }
    if ('nice_name' in item && item.nice_name) {
      return item.nice_name
    }
    return `Item ${index + 1}`
  }

  const toggleItemSelection = (index: number) => {
    const newSelection = new Set(selectedItems)
    if (newSelection.has(index)) {
      newSelection.delete(index)
    } else {
      newSelection.add(index)
    }
    setSelectedItems(newSelection)
  }

  const toggleAllSelection = () => {
    const items = Array.isArray(importData?.data) ? importData.data : [importData?.data]
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(Array.from({ length: items.length }, (_, i) => i)))
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1
          }}>
          <FileUploadIcon sx={{ color: NAVIGATION_COLORS.info }} />
          Import Configuration
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 1: Upload */}
        {activeStep === 0 && (
          <Box>
            {validationErrors.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {validationErrors.map((error) => (
                  <Typography key={error} variant="body2">{error}</Typography>
                ))}
              </Alert>
            )}
            
            <Paper
              {...getRootProps()}
              sx={{
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'divider',
              }}
            >
              <input {...getInputProps()} />
              <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive ? 'Drop the file here' : 'Drag & drop a JSON file here'}
              </Typography>
              <Typography variant="body2" sx={{
                color: "text.secondary"
              }}>
                or click to select a file
              </Typography>
            </Paper>

            {file && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileIcon />
                <Typography>{file.name}</Typography>
                <IconButton size="small" onClick={() => setFile(null)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            )}
          </Box>
        )}

        {/* Step 2: Preview */}
        {activeStep === 1 && importData && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Type: <strong>{importData.type.replace('_', ' ').toUpperCase()}</strong>
              </Typography>
              <Typography variant="body2">
                Exported: {new Date(importData.exported_at).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Items: {Array.isArray(importData.data) ? importData.data.length : 1}
              </Typography>
            </Alert>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Select items to import:
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedItems.size === (Array.isArray(importData.data) ? importData.data.length : 1)}
                    indeterminate={selectedItems.size > 0 && selectedItems.size < (Array.isArray(importData.data) ? importData.data.length : 1)}
                    onChange={toggleAllSelection}
                  />
                }
                label="Select All"
              />
              <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                {(Array.isArray(importData.data) ? importData.data : [importData.data]).map((item, index) => (
                  <ListItem key={(item as { id?: number }).id ?? index}>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedItems.has(index)}
                        onChange={() => toggleItemSelection(index)}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={getItemDisplayName(item, index)}
                      secondary={(item as ProxyHost).forward_host ? `→ ${(item as ProxyHost).forward_host}:${(item as ProxyHost).forward_port}` : (item as RedirectionHost).forward_domain_name ? `→ ${(item as RedirectionHost).forward_domain_name}` : undefined}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            <FormControl component="fieldset">
              <FormLabel component="legend">Import Options</FormLabel>
              <RadioGroup
                value={
                  importOptions.overwriteExisting ? 'overwrite' :
                  importOptions.renameOnConflict ? 'rename' : 'skip'
                }
                onChange={(e) => {
                  const value = e.target.value
                  setImportOptions({
                    overwriteExisting: value === 'overwrite',
                    skipExisting: value === 'skip',
                    renameOnConflict: value === 'rename',
                  })
                }}
              >
                <FormControlLabel 
                  value="skip" 
                  control={<Radio />} 
                  label="Skip existing items" 
                />
                <FormControlLabel 
                  value="rename" 
                  control={<Radio />} 
                  label="Rename on conflict (add suffix)" 
                />
                <FormControlLabel 
                  value="overwrite" 
                  control={<Radio />} 
                  label="Overwrite existing items" 
                />
              </RadioGroup>
            </FormControl>
          </Box>
        )}

        {/* Step 3: Import Results */}
        {activeStep === 2 && (
          <Box>
            {importing ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Importing...</Typography>
              </Box>
            ) : (
              <Box>
                <Alert 
                  severity={importResults.failed > 0 ? 'warning' : 'success'}
                  icon={importResults.failed > 0 ? <WarningIcon /> : <CheckCircleIcon />}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body1">
                    Successfully imported: {importResults.success} items
                  </Typography>
                  {importResults.failed > 0 && (
                    <Typography variant="body1">
                      Failed: {importResults.failed} items
                    </Typography>
                  )}
                </Alert>

                {importResults.errors.length > 0 && (
                  <Alert severity="error">
                    <Typography variant="subtitle2" gutterBottom>Errors:</Typography>
                    {importResults.errors.map((error) => (
                      <Typography key={error} variant="body2">• {error}</Typography>
                    ))}
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          {activeStep === 2 && !importing ? 'Close' : 'Cancel'}
        </Button>
        {activeStep === 1 && (
          <>
            <Button onClick={() => setActiveStep(0)}>Back</Button>
            <Button
              onClick={handleImport}
              variant="contained"
              startIcon={<UploadIcon />}
              disabled={selectedItems.size === 0}
            >
              Import {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}