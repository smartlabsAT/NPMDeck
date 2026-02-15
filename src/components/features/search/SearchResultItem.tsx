import {
  Box,
  Divider,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material'
import {
  SwapHoriz,
  TrendingFlat,
  Block,
  Stream,
  Security,
  VpnKey,
  Group,
  Add,
  CheckCircle,
  Cancel,
  Error as ErrorIcon,
} from '@mui/icons-material'
import logger from '../../../utils/logger'
import { NAVIGATION_COLORS } from '../../../constants/navigation'
import { SearchResult, ResourceType } from '../../../types/search'

interface SearchResultItemProps {
  option: SearchResult | { type: 'divider' }
  listItemProps: React.HTMLAttributes<HTMLLIElement>
}

/**
 * Returns the appropriate icon for a given resource type.
 * When isAction is false and type is 'action', returns a generic Add icon.
 */
const getResourceIcon = (type: ResourceType, isAction: boolean = false) => {
  if (type === 'action' && !isAction) {
    return <Add sx={{ color: 'primary.main' }} />
  }

  switch (type) {
    case 'proxy_hosts':
      return <SwapHoriz sx={{ color: NAVIGATION_COLORS.success }} />
    case 'redirection_hosts':
      return <TrendingFlat sx={{ color: NAVIGATION_COLORS.warning }} />
    case 'dead_hosts':
      return <Block sx={{ color: NAVIGATION_COLORS.danger }} />
    case 'streams':
      return <Stream sx={{ color: NAVIGATION_COLORS.info }} />
    case 'access_lists':
      return <Security sx={{ color: NAVIGATION_COLORS.primary }} />
    case 'certificates':
      return <VpnKey sx={{ color: NAVIGATION_COLORS.info }} />
    case 'users':
      return <Group sx={{ color: NAVIGATION_COLORS.secondary }} />
    default:
      return <Add sx={{ color: 'primary.main' }} />
  }
}

/**
 * Returns a status indicator icon based on the resource status.
 */
const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'online':
      return <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />
    case 'offline':
      return <ErrorIcon sx={{ color: 'error.main', fontSize: 16 }} />
    case 'disabled':
      return <Cancel sx={{ color: 'text.disabled', fontSize: 16 }} />
    default:
      return null
  }
}

/**
 * Renders a single search result item within the Autocomplete dropdown.
 * Handles both divider entries and normal search result / action entries.
 */
const SearchResultItem = ({ option, listItemProps }: SearchResultItemProps) => {
  if (option.type === 'divider') {
    return <Divider key="divider" />
  }

  // At this point option is a SearchResult (not a divider)
  const searchResult = option as SearchResult

  // Determine the icon to show
  let icon
  if (searchResult.type === 'action' && searchResult.metadata?.resourceType) {
    logger.debug('Rendering action with resourceType:', searchResult.metadata.resourceType)
    // For actions, show the Add icon with the resource type icon
    icon = (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5
        }}>
        <Add sx={{ fontSize: 18 }} />
        {getResourceIcon(searchResult.metadata.resourceType)}
      </Box>
    )
  } else {
    // For regular resources, show the resource icon
    icon = getResourceIcon(searchResult.type)
  }

  return (
    <ListItem {...listItemProps} key={searchResult.id}>
      <ListItemIcon sx={{ minWidth: 56 }}>
        {icon}
      </ListItemIcon>
      <ListItemText
        primary={
          <Box
            component="span"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1
            }}>
            {searchResult.title}
            {searchResult.metadata?.ssl && (
              <VpnKey sx={{ fontSize: 16, color: 'success.main' }} />
            )}
            {searchResult.metadata?.status && getStatusIcon(searchResult.metadata.status)}
          </Box>
        }
        secondary={
          <Box component="span">
            {searchResult.subtitle && (
              <Typography variant="caption" component="span" sx={{
                color: "text.secondary"
              }}>
                {searchResult.subtitle}
              </Typography>
            )}
            {searchResult.metadata?.owner && (
              <Typography
                variant="caption"
                component="span"
                sx={{
                  color: "text.secondary",
                  ml: 1
                }}>
                • {searchResult.metadata.owner}
              </Typography>
            )}
          </Box>
        }
      />
    </ListItem>
  )
}

export default SearchResultItem