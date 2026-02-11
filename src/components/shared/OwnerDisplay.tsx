import { Box, Typography, Avatar, Tooltip } from '@mui/material'
import { Person as PersonIcon } from '@mui/icons-material'
import { Owner } from '../../types/common'

interface OwnerDisplayProps {
  owner?: Owner | null
  userId?: number
  showAvatar?: boolean
  size?: 'small' | 'medium' | 'large'
  showEmail?: boolean
}

const OwnerDisplay = ({
  owner,
  userId,
  showAvatar = false,
  size = 'medium',
  showEmail = false
}: OwnerDisplayProps) => {
  // If no owner object but userId is provided, show user ID
  if (!owner && userId) {
    return (
      <Box display="flex" alignItems="center" gap={0.5}>
        <PersonIcon fontSize="small" color="action" />
        <Typography variant={size === 'small' ? 'caption' : 'body2'}>
          User #{userId}
        </Typography>
      </Box>
    )
  }

  // If no owner at all
  if (!owner) {
    return (
      <Box display="flex" alignItems="center" gap={0.5}>
        <PersonIcon fontSize="small" color="action" />
        <Typography variant={size === 'small' ? 'caption' : 'body2'} color="text.secondary">
          Unknown
        </Typography>
      </Box>
    )
  }

  // Get display name - prefer nickname, fallback to name
  const displayName = owner.nickname || owner.name || owner.email

  const avatarSize = {
    small: 24,
    medium: 32,
    large: 40
  }[size]

  // Create tooltip text
  const tooltipText = owner.id ? `#${owner.id}` : userId ? `#${userId}` : ''

  const content = (
    <Box display="flex" alignItems="center" gap={1}>
      {showAvatar ? (
        <Avatar 
          sx={{ width: avatarSize, height: avatarSize }}
        >
          {displayName.charAt(0).toUpperCase()}
        </Avatar>
      ) : (
        <PersonIcon fontSize="small" color="action" />
      )}
      <Box>
        <Typography variant={size === 'small' ? 'caption' : 'body2'} fontWeight="medium">
          {displayName}
        </Typography>
        {showEmail && owner.email && owner.email !== displayName && (
          <Typography variant="caption" color="text.secondary">
            {owner.email}
          </Typography>
        )}
      </Box>
    </Box>
  )

  // Wrap in tooltip if we have an ID to show
  if (tooltipText) {
    return (
      <Tooltip title={tooltipText} arrow placement="top">
        <span style={{ display: 'inline-flex' }}>
          {content}
        </span>
      </Tooltip>
    )
  }

  return content
}

export default OwnerDisplay