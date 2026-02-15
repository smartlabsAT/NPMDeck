import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@mui/material'
import {
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material'
import { NAVIGATION_COLORS } from '../../constants/navigation'
import type { NavigationMenuItem } from '../../hooks/useNavigationMenu'

interface DrawerNavigationMenuProps {
  menuItems: NavigationMenuItem[]
  currentPath: string
  onNavigate: (path: string) => void
}

/**
 * Renders the main navigation list within the drawer.
 * Supports nested menu items with collapsible sections.
 */
const DrawerNavigationMenu = ({ menuItems, currentPath, onNavigate }: DrawerNavigationMenuProps) => {
  return (
    <List sx={{ pt: 2.5, px: 1 }}>
      {menuItems.map((item) => (
        <div key={item.text}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={item.onClick || (() => item.path && onNavigate(item.path))}
              selected={item.path ? currentPath === item.path : false}
              sx={{
                mr: 1,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(43, 203, 186, 0.08)',
                  borderRight: `3px solid ${NAVIGATION_COLORS.primary}`,
                  '&:hover': {
                    backgroundColor: 'rgba(43, 203, 186, 0.12)',
                  }
                }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
              {item.children && (item.open ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
          </ListItem>
          {item.children && (
            <Collapse in={item.open} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {item.children.map((child) => (
                  <ListItemButton
                    key={child.text}
                    sx={{ 
                      pl: 4,
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(43, 203, 186, 0.08)',
                        borderRight: `3px solid ${NAVIGATION_COLORS.primary}`,
                        '&:hover': {
                          backgroundColor: 'rgba(43, 203, 186, 0.12)',
                        }
                      }
                    }}
                    selected={currentPath === child.path}
                    onClick={() => child.path && onNavigate(child.path)}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>{child.icon}</ListItemIcon>
                    <ListItemText 
                      primary={child.text} 
                      slotProps={{
                        primary: { fontSize: '0.875rem' }
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          )}
        </div>
      ))}
    </List>
  )
}

export default DrawerNavigationMenu