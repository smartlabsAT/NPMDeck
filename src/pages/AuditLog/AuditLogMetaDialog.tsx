import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  useTheme,
} from '@mui/material'
import { Description as AuditIcon } from '@mui/icons-material'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json'
import { atomOneDark, atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { format } from 'date-fns'
import { AuditLogEntry } from '../../api/auditLog'
import ActionChip from '../../components/shared/ActionChip'
import { NAVIGATION_COLORS } from '../../constants/navigation'
import { getObjectIcon } from './auditLogColumns'

SyntaxHighlighter.registerLanguage('json', json)

interface AuditLogMetaDialogProps {
  open: boolean
  entry: AuditLogEntry | null
  onClose: () => void
}

function AuditLogMetaDialog({ open, entry, onClose }: AuditLogMetaDialogProps) {
  const theme = useTheme()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}>
          <AuditIcon sx={{ color: NAVIGATION_COLORS.dark }} />
          Audit Log Details
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {entry && (
          <Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
                Action Information
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '200px 1fr',
                    gap: 1,
                  }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>User:</Typography>
                  <Typography variant="body2">
                    {entry.user.name} ({entry.user.email})
                  </Typography>

                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Action:</Typography>
                  <ActionChip action={entry.action} />

                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Object Type:</Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}>
                    {getObjectIcon(entry.object_type)}
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {entry.object_type.replace('-', ' ')}
                    </Typography>
                  </Box>

                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Object ID:</Typography>
                  <Typography variant="body2">{entry.object_id}</Typography>

                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Date:</Typography>
                  <Typography variant="body2">
                    {format(new Date(entry.created_on), 'PPpp')}
                  </Typography>
                </Box>
              </Paper>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
                Metadata
              </Typography>
              <Paper variant="outlined" sx={{ p: 0, backgroundColor: 'action.hover', overflow: 'hidden' }}>
                <SyntaxHighlighter
                  language="json"
                  style={theme.palette.mode === 'dark' ? atomOneDark : atomOneLight}
                  customStyle={{
                    margin: 0,
                    padding: '16px',
                    backgroundColor: 'transparent',
                    fontSize: '0.875rem',
                  }}
                  wrapLongLines={true}
                >
                  {JSON.stringify(entry.meta, null, 2)}
                </SyntaxHighlighter>
              </Paper>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default AuditLogMetaDialog
