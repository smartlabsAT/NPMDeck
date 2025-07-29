import React from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Box,
} from '@mui/material'

// DNS providers - subset of most common providers from backend/global/certbot-dns-plugins.json
const DNS_PROVIDERS: Record<string, { name: string; credentials: string | false }> = {
  'cloudflare': { 
    name: 'Cloudflare', 
    credentials: '# Cloudflare API token\ndns_cloudflare_api_token=0123456789abcdef0123456789abcdef01234567' 
  },
  'digitalocean': { 
    name: 'DigitalOcean', 
    credentials: 'dns_digitalocean_token = 0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff' 
  },
  'dnsimple': { 
    name: 'DNSimple', 
    credentials: 'dns_dnsimple_token = MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw' 
  },
  'dnsmadeeasy': { 
    name: 'DNS Made Easy', 
    credentials: 'dns_dnsmadeeasy_api_key = 1c1a3c91-4770-4ce7-96f4-54c0eb0e457a\ndns_dnsmadeeasy_secret_key = c9b5625f-9834-4ff8-baba-4ed5f32cae55' 
  },
  'google': { 
    name: 'Google', 
    credentials: '{\n"type": "service_account",\n...\n}' 
  },
  'godaddy': { 
    name: 'GoDaddy', 
    credentials: 'dns_godaddy_secret = 0123456789abcdef0123456789abcdef01234567\ndns_godaddy_key = abcdef0123456789abcdef01234567abcdef0123' 
  },
  'hetzner': { 
    name: 'Hetzner', 
    credentials: 'dns_hetzner_api_token = 0123456789abcdef0123456789abcdef' 
  },
  'linode': { 
    name: 'Linode', 
    credentials: 'dns_linode_key = 0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ64\ndns_linode_version = [<blank>|3|4]' 
  },
  'namecheap': { 
    name: 'Namecheap', 
    credentials: 'dns_namecheap_username  = 123456\ndns_namecheap_api_key      = 0123456789abcdef0123456789abcdef01234567' 
  },
  'ovh': { 
    name: 'OVH', 
    credentials: 'dns_ovh_endpoint = ovh-eu\ndns_ovh_application_key = MDAwMDAwMDAwMDAw\ndns_ovh_application_secret = MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw\ndns_ovh_consumer_key = MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw' 
  },
  'route53': { 
    name: 'Route 53 (Amazon)', 
    credentials: '[default]\naws_access_key_id=AKIAIOSFODNN7EXAMPLE\naws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' 
  },
  'vultr': { 
    name: 'Vultr', 
    credentials: 'dns_vultr_key = YOUR_VULTR_API_KEY' 
  },
  'gandi': { 
    name: 'Gandi Live DNS', 
    credentials: '# Gandi personal access token\ndns_gandi_token=PERSONAL_ACCESS_TOKEN' 
  },
  'azure': { 
    name: 'Azure', 
    credentials: '# Using a service principal (option 1)\ndns_azure_sp_client_id = 912ce44a-0156-4669-ae22-c16a17d34ca5\ndns_azure_sp_client_secret = E-xqXU83Y-jzTI6xe9fs2YC~mck3ZzUih9\ndns_azure_tenant_id = ed1090f3-ab18-4b12-816c-599af8a88cf7\n\n# Zones (at least one always required)\ndns_azure_zone1 = example.com:/subscriptions/c135abce-d87d-48df-936c-15596c6968a5/resourceGroups/dns1' 
  },
}

interface DNSProviderSelectorProps {
  value: string
  onChange: (provider: string) => void
  credentials: string
  onCredentialsChange: (credentials: string) => void
  error?: string
}

export default function DNSProviderSelector({
  value,
  onChange,
  credentials,
  onCredentialsChange,
  error
}: DNSProviderSelectorProps) {
  // Update credentials template when provider changes
  React.useEffect(() => {
    if (value && DNS_PROVIDERS[value]?.credentials) {
      onCredentialsChange(DNS_PROVIDERS[value].credentials as string)
    }
  }, [value, onCredentialsChange])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth required error={Boolean(error)}>
        <InputLabel>DNS Provider</InputLabel>
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          label="DNS Provider"
        >
          <MenuItem value="">
            <em>Select a DNS provider</em>
          </MenuItem>
          {Object.entries(DNS_PROVIDERS).map(([key, provider]) => (
            <MenuItem key={key} value={key}>
              {provider.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {value && DNS_PROVIDERS[value]?.credentials && (
        <>
          <Alert severity="info">
            Configure your DNS provider credentials below. The template shows the required format.
          </Alert>
          
          <TextField
            fullWidth
            required
            label="DNS Provider Credentials"
            value={credentials}
            onChange={(e) => onCredentialsChange(e.target.value)}
            multiline
            rows={6}
            error={Boolean(error)}
            helperText={error || "Enter your DNS provider credentials in the format shown"}
            sx={{ 
              '& .MuiInputBase-root': {
                fontFamily: 'monospace',
                fontSize: '0.875rem',
              }
            }}
          />
        </>
      )}

      {error && (
        <Alert severity="error">
          {error}
        </Alert>
      )}
    </Box>
  )
}