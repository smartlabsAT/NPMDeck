import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
  Typography,
} from '@mui/material'
import {
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material'
import type { NavigationMenuItem } from '../../hooks/useNavigationMenu'

interface DrawerAdminSectionProps {
  adminItems: NavigationMenuItem[]
  onNavigate: (path: string) => void
}

/**
 * Renders the administration section in the drawer with a divider,
 * "Administration" label, and collapsible admin menu items.
 */
const DrawerAdminSection = ({ adminItems, onNavigate }: DrawerAdminSectionProps) => {
  return (
    <>
      <Divider sx={{ my: 1 }} />
      <Box sx={{ px: 2, py: 0.5 }}>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1
          }}>
          Administration
        </Typography>
      </Box>
      <List sx={{ pt: 0.5, px: 1 }}>
        {adminItems.map((item) => (
          <div key={item.text}>
            <ListItem disablePadding>
              <ListItemButton onClick={item.onClick}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
                {item.open ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={item.open} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {item.children?.map((child) => (
                  <ListItemButton
                    key={child.text}
                    sx={{ pl: 4 }}
                    onClick={() => child.path && onNavigate(child.path)}
                  >
                    <ListItemIcon>{child.icon}</ListItemIcon>
                    <ListItemText primary={child.text} />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </div>
        ))}
      </List>
    </>
  )
}

export default DrawerAdminSection