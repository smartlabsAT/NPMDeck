import {
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Collapse,
  ListItemButton,
} from '@mui/material'
import {
  ContentCopy as CopyIcon,
  Language as LanguageIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material'
import { ProxyHost } from '../../../api/proxyHosts'

interface ProxyHostDomainListSectionProps {
  host: ProxyHost
  expanded: boolean
  copiedText: string
  onToggle: () => void
  onCopyToClipboard: (text: string, label?: string) => void
}

const ProxyHostDomainListSection = ({
  host,
  expanded,
  copiedText: _copiedText,
  onToggle,
  onCopyToClipboard,
}: ProxyHostDomainListSectionProps) => (
  <>
    <ListItemButton onClick={onToggle} sx={{ pl: 0, pr: 1 }}>
      <ListItemText
        primary={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1
            }}>
            <LanguageIcon color="primary" />
            <Typography variant="h6">
              Domain Names ({host.domain_names.length})
            </Typography>
          </Box>
        }
      />
      {expanded ? <ExpandLess /> : <ExpandMore />}
    </ListItemButton>

    <Collapse in={expanded} timeout="auto" unmountOnExit>
      <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, mt: 1 }}>
        {host.domain_names.map((domain) => (
          <ListItem
            key={domain}
            secondaryAction={
              <IconButton
                edge="end"
                size="small"
                aria-label="Copy to clipboard"
                onClick={() => onCopyToClipboard(domain, domain)}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            }
          >
            <ListItemText primary={domain} />
          </ListItem>
        ))}
      </List>
    </Collapse>
  </>
)

export default ProxyHostDomainListSection
