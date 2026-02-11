import { GlobalSearchProvider } from '../contexts/GlobalSearchContext'
import Layout from './Layout'

const LayoutWithSearch = () => {
  return (
    <GlobalSearchProvider>
      <Layout />
    </GlobalSearchProvider>
  )
}

export default LayoutWithSearch