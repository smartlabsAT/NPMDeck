import React from 'react'
import {
  TextField,
  Stack,
} from '@mui/material'
import {
  Description as FileIcon,
  Key as KeyIcon,
  AccountTree as ChainIcon,
} from '@mui/icons-material'
import FormSection from '../../shared/FormSection'
import FileDropzone from './components/FileDropzone'
import type { CertificateFormData } from './CertificateDrawer'

interface CustomCertificateSectionProps {
  data: Pick<
    CertificateFormData,
    | 'niceName'
    | 'certificateFile'
    | 'certificateKeyFile'
    | 'intermediateCertificateFile'
  >
  errors: Partial<Record<keyof CertificateFormData, string>>
  touched: Partial<Record<keyof CertificateFormData, boolean>>
  setFieldValue: <K extends keyof CertificateFormData>(field: K, value: CertificateFormData[K]) => void
}

export default function CustomCertificateSection({
  data,
  errors,
  touched,
  setFieldValue,
}: CustomCertificateSectionProps) {
  return (
    <>
      <FormSection title="Certificate Name" required>
        <TextField
          label="Certificate Name"
          value={data.niceName}
          onChange={(e) => setFieldValue('niceName', e.target.value)}
          placeholder="e.g. Production SSL Certificate"
          fullWidth
          required
          error={Boolean(errors.niceName && touched.niceName)}
          helperText={errors.niceName && touched.niceName ? errors.niceName : "A friendly name to identify this certificate"}
        />
      </FormSection>

      <FormSection title="Certificate Files" required>
        <Stack spacing={3}>
          <FileDropzone
            label="Certificate File"
            icon={<FileIcon color="action" />}
            file={data.certificateFile}
            onFileSelect={(file) => setFieldValue('certificateFile', file)}
            accept=".pem,.crt,.cer"
            required
            validateType="certificate"
            helperText="The SSL certificate file (should start with -----BEGIN CERTIFICATE-----)"
          />

          <FileDropzone
            label="Private Key"
            icon={<KeyIcon color="action" />}
            file={data.certificateKeyFile}
            onFileSelect={(file) => setFieldValue('certificateKeyFile', file)}
            accept=".key,.pem"
            required
            validateType="key"
            helperText="The private key file (should start with -----BEGIN PRIVATE KEY-----)"
          />

          <FileDropzone
            label="Intermediate Certificate (optional)"
            icon={<ChainIcon color="action" />}
            file={data.intermediateCertificateFile}
            onFileSelect={(file) => setFieldValue('intermediateCertificateFile', file)}
            accept=".pem,.crt,.cer"
            helperText="Optional intermediate certificate for certificate chain validation"
          />
        </Stack>
      </FormSection>
    </>
  )
}
