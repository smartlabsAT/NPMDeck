import { GlobalSearchProvider } from '../contexts/GlobalSearchContext'
import Layout from './Layout'
import logger from '../utils/logger'

const LayoutWithSearch: React.FC = () => {
  logger.debug('LayoutWithSearch rendering')
  return (
    <GlobalSearchProvider>
      <Layout />
    </GlobalSearchProvider>
  )
}

export default LayoutWithSearch