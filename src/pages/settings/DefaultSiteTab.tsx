import React from 'react'
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material'
import {
  ContentCopy as CopyIcon,
  Save as SaveIcon,
} from '@mui/icons-material'
import Editor from 'react-simple-code-editor'
// @ts-expect-error - prismjs type declarations don't cover all exports
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-markup'
import TabPanel from '../../components/shared/TabPanel'
import FormSection from '../../components/shared/FormSection'
import { useResponsive } from '../../hooks/useResponsive'
import { HTML_TEMPLATES } from './htmlTemplates'

interface DefaultSiteTabProps {
  activeTab: number
  defaultSiteType: string
  defaultSiteHtml: string
  defaultSiteCards: React.ReactNode
  saving: boolean
  onSetDefaultSiteHtml: (html: string) => void
  onSaveDefaultSite: () => void
  onCopyHtml: () => void
}

/**
 * Default Site tab content for the Settings page.
 * Displays options for choosing the default page type and a custom HTML editor.
 */
const DefaultSiteTab = ({
  activeTab,
  defaultSiteType,
  defaultSiteHtml,
  defaultSiteCards,
  saving,
  onSetDefaultSiteHtml,
  onSaveDefaultSite,
  onCopyHtml,
}: DefaultSiteTabProps) => {
  const theme = useTheme()
  const { isMobile } = useResponsive()

  return (
    <TabPanel value={activeTab} index={0} padding={isMobile ? 2 : 3} animation="none">
      <FormSection title="Choose Default Page" sx={{ mb: 4 }}>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            mb: 3
          }}>
          Select what visitors see when they access your server directly or via an unmatched domain
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
          {defaultSiteCards}
        </Box>
      </FormSection>

      {defaultSiteType === 'html' && (
        <FormSection title="Custom HTML Content">
          <Box sx={{
            mb: 2,
            display: 'flex',
            gap: 1,
            flexDirection: isMobile ? 'column' : 'row',
            flexWrap: isMobile ? 'nowrap' : 'wrap',
            alignItems: isMobile ? 'stretch' : 'flex-start'
          }}>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                width: '100%',
                mb: 1
              }}>
              Quick Templates:
            </Typography>
            <Box sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: 1,
              width: isMobile ? '100%' : 'auto',
              flex: isMobile ? '1' : 'none'
            }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => onSetDefaultSiteHtml(HTML_TEMPLATES.basic)}
                fullWidth={isMobile}
              >
                Basic Page
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => onSetDefaultSiteHtml(HTML_TEMPLATES.styled)}
                fullWidth={isMobile}
              >
                Styled Welcome
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => onSetDefaultSiteHtml(HTML_TEMPLATES.maintenance)}
                fullWidth={isMobile}
              >
                Maintenance
              </Button>
            </Box>
            {!isMobile && <Box sx={{ flexGrow: 1 }} />}
            <Box sx={{
              display: 'flex',
              justifyContent: isMobile ? 'center' : 'flex-end',
              width: isMobile ? '100%' : 'auto'
            }}>
              <Tooltip title="Copy HTML">
                <IconButton size="small" onClick={onCopyHtml}>
                  <CopyIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Paper
            variant="outlined"
            sx={{
              backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.background.paper,
              borderRadius: 1,
              overflow: 'hidden',
              width: '100%',
              '& pre': {
                margin: 0,
              },
              // Custom syntax highlighting colors for light/dark theme
              '& .token.tag': {
                color: theme.palette.mode === 'dark' ? '#e06c75' : '#e45649',
              },
              '& .token.attr-name': {
                color: theme.palette.mode === 'dark' ? '#d19a66' : '#986801',
              },
              '& .token.attr-value': {
                color: theme.palette.mode === 'dark' ? '#98c379' : '#50a14f',
              },
              '& .token.punctuation': {
                color: theme.palette.text.primary,
              },
              '& .token.doctype': {
                color: theme.palette.mode === 'dark' ? '#c678dd' : '#a626a4',
              },
              '& .token.comment': {
                color: theme.palette.mode === 'dark' ? '#5c6370' : '#a0a1a7',
                fontStyle: 'italic',
              },
              '& .token.string': {
                color: theme.palette.mode === 'dark' ? '#98c379' : '#50a14f',
              },
              '& .token.selector': {
                color: theme.palette.mode === 'dark' ? '#e06c75' : '#e45649',
              },
              '& .token.property': {
                color: theme.palette.mode === 'dark' ? '#d19a66' : '#986801',
              },
              '& .token.function': {
                color: theme.palette.mode === 'dark' ? '#61afef' : '#4078f2',
              },
            }}
          >
            <Editor
              value={defaultSiteHtml}
              onValueChange={onSetDefaultSiteHtml}
              highlight={code => highlight(code, languages.html, 'html')}
              padding={isMobile ? 12 : 16}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: isMobile ? 12 : 14,
                minHeight: isMobile ? 300 : 400,
                width: '100%',
                color: theme.palette.text.primary,
                backgroundColor: 'transparent',
                overflowX: 'auto'
              }}
              placeholder="Enter your custom HTML content here..."
            />
          </Paper>

          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              mt: 1,
              display: 'block'
            }}>
            Create your own custom HTML page that will be displayed as the default
          </Typography>
        </FormSection>
      )}

      {defaultSiteType !== 'html' && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            {defaultSiteType === 'congratulations' && 'The standard Nginx Proxy Manager congratulations page will be displayed.'}
            {defaultSiteType === '404' && 'A standard 404 Not Found error page will be displayed.'}
            {defaultSiteType === '444' && 'The connection will be closed without sending any response (HTTP 444).'}
          </Typography>
        </Alert>
      )}

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={onSaveDefaultSite}
          disabled={saving || (defaultSiteType === 'html' && !defaultSiteHtml.trim())}
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {saving ? 'Saving...' : 'Save Default Site Settings'}
        </Button>
      </Box>
    </TabPanel>
  )
}

export default DefaultSiteTab
