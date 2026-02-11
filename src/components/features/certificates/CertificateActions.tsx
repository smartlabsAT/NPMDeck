import { Button } from '@mui/material'
import { Edit as EditIcon } from '@mui/icons-material'
import { Certificate } from '../../../api/certificates'
import PermissionButton from '../../PermissionButton'

interface CertificateActionsProps {
  certificate: Certificate
  onClose: () => void
  onEdit?: (certificate: Certificate) => void
}

const CertificateActions = ({
  certificate,
  onClose,
  onEdit,
}: CertificateActionsProps) => {
  return (
    <>
      {onEdit && (
        <PermissionButton
          resource="certificates"
          permissionAction="edit"
          variant="contained"
          onClick={() => {
            onClose()
            onEdit(certificate)
          }}
          startIcon={<EditIcon />}
          color="primary"
        >
          Edit Certificate
        </PermissionButton>
      )}
      <Button onClick={onClose}>Close</Button>
    </>
  )
}

export default CertificateActions