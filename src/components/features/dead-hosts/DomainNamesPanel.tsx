import {
  Typography,
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
} from '@mui/material'
import {
  ContentCopy as CopyIcon,
  Language as LanguageIcon,
} from '@mui/icons-material'

interface DomainNamesPanelProps {
  domainNames: string[]
  onCopyToClipboard: (text: string, label?: string) => void
}

/** Domain names list with copy-to-clipboard functionality */
const DomainNamesPanel = ({ domainNames, onCopyToClipboard }: DomainNamesPanelProps) => {
  return (
    <>
      <Grid size={12}>
        <Divider />
      </Grid>

      <Grid size={12}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 2
          }}>
          <LanguageIcon color="primary" />
          <Typography variant="h6">
            Domain Names ({domainNames.length})
          </Typography>
        </Box>
        
        <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
          {domainNames.map((domain, index) => (
            <ListItem
              key={index}
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
      </Grid>
    </>
  )
}

export default DomainNamesPanel