import React from 'react'
import { Alert } from '@mui/material'
import { Certificate } from '../../../api/certificates'

interface CertificateAdvancedPanelProps {
  certificate: Certificate
}

const CertificateAdvancedPanel: React.FC<CertificateAdvancedPanelProps> = ({
  certificate,
}) => {
  return (
    <Alert severity="info">
      Advanced certificate information and raw certificate data will be displayed here in the future.
    </Alert>
  )
}

export default CertificateAdvancedPanel