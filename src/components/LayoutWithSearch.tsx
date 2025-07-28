import React from 'react'
import { GlobalSearchProvider } from '../contexts/GlobalSearchContext'
import Layout from './Layout'

const LayoutWithSearch: React.FC = () => {
  console.log('LayoutWithSearch rendering')
  return (
    <GlobalSearchProvider>
      <Layout />
    </GlobalSearchProvider>
  )
}

export default LayoutWithSearch