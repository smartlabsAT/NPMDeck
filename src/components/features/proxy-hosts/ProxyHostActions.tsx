import { Button } from '@mui/material'
import { Edit as EditIcon } from '@mui/icons-material'
import { ProxyHost } from '../../../api/proxyHosts'
import PermissionButton from '../../PermissionButton'

interface ProxyHostActionsProps {
  host: ProxyHost
  onClose: () => void
  onEdit?: (host: ProxyHost) => void
}

const ProxyHostActions = ({
  host,
  onClose,
  onEdit,
}: ProxyHostActionsProps) => {
  return (
    <>
      <Button onClick={onClose}>Close</Button>
      {onEdit && (
        <PermissionButton
          resource="proxy_hosts"
          permissionAction="edit"
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => onEdit(host)}
        >
          Edit
        </PermissionButton>
      )}
    </>
  )
}

export default ProxyHostActions