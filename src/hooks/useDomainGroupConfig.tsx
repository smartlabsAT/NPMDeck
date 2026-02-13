import React, { useMemo } from 'react'
import {
  Box,
  Typography,
} from '@mui/material'
import {
  Language as LanguageIcon,
} from '@mui/icons-material'
import type { GroupConfig } from '../components/DataTable/types'
import { extractBaseDomain } from '../utils/domainUtils'

/** Entity shape required for domain grouping -- must have domain_names */
interface DomainEntity {
  domain_names: string[]
}

/**
 * Custom hook that provides a shared GroupConfig for domain-based grouping.
 * Used by both ProxyHosts and RedirectionHosts DataTables to group items
 * by their base domain (e.g. "example.com" groups "api.example.com" and "www.example.com").
 */
const useDomainGroupConfig = <T extends DomainEntity>(): GroupConfig<T> => {
  const groupConfig = useMemo<GroupConfig<T>>(() => ({
    groupBy: (item) => {
      const mainDomain = item.domain_names[0] || ''
      return extractBaseDomain(mainDomain)
    },
    groupLabel: (_groupId, _items) => `domain`,
    defaultEnabled: false,
    groupHeaderRender: (groupId, items, _isExpanded) => (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1
        }}>
        <LanguageIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" sx={{
          fontWeight: "bold"
        }}>
          {groupId}
        </Typography>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          ({items.length})
        </Typography>
      </Box>
    )
  }), [])

  return groupConfig
}

export default useDomainGroupConfig
