import { Typography } from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

const DeadHosts = () => {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (id) {
      // TODO: Implement edit functionality when DeadHosts is implemented
      console.log('Edit 404 host with ID:', id)
    }
  }, [id])

  return (
    <div>
      <Typography variant="h4">404 Hosts</Typography>
      <Typography>Coming soon...</Typography>
      {id && <Typography>Edit mode for host ID: {id}</Typography>}
    </div>
  )
}

export default DeadHosts
