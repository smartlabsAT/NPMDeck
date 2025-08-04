import { GlobalSearchProvider } from '../contexts/GlobalSearchContext'
import Layout from './Layout'

const LayoutWithSearch: React.FC = () => {
  return (
    <GlobalSearchProvider>
      <Layout />
    </GlobalSearchProvider>
  )
}

export default LayoutWithSearch