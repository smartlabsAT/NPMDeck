import { Box, Typography } from '@mui/material'

interface PageHeaderProps {
  icon: React.ReactNode
  title: string
  description: string
}

const PageHeader = ({ icon, title, description }: PageHeaderProps) => {
  return (
    <Box display="flex" alignItems="center" gap={2} mb={3}>
      <Box sx={{ fontSize: '2.5rem' }}>
        {icon}
      </Box>
      <div>
        <Typography variant="h4">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </div>
    </Box>
  )
}

export default PageHeader