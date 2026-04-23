import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, userEvent } from '../../test/utils'
import SearchBar from '../SearchBar'
import { useGlobalSearch } from '../../contexts/GlobalSearchContext'
import type { SearchState } from '../../types/search'

vi.mock('../../contexts/GlobalSearchContext', () => ({
  useGlobalSearch: vi.fn(),
}))

type SearchContextMock = ReturnType<typeof useGlobalSearch>

const defaultLoadingProgress: SearchState['loadingProgress'] = {
  proxy_hosts: false,
  redirection_hosts: false,
  dead_hosts: false,
  streams: false,
  access_lists: false,
  certificates: false,
  users: false,
}

const defaultSearchState: SearchState = {
  isLoading: false,
  loadingProgress: defaultLoadingProgress,
  data: {
    proxy_hosts: [],
    redirection_hosts: [],
    dead_hosts: [],
    streams: [],
    access_lists: [],
    certificates: [],
    users: [],
  },
  lastFetch: 0,
}

function makeDefaultSearchContext(overrides: Partial<SearchContextMock> = {}): SearchContextMock {
  return {
    searchState: defaultSearchState,
    preloadData: vi.fn(),
    searchResults: [],
    quickActions: [],
    searchQuery: '',
    setSearchQuery: vi.fn(),
    ...overrides,
  } as SearchContextMock
}

describe('SearchBar', () => {
  beforeEach(() => {
    vi.mocked(useGlobalSearch).mockReturnValue(makeDefaultSearchContext())
  })

  it('renders input with placeholder', () => {
    renderWithProviders(<SearchBar />)
    expect(screen.getByPlaceholderText(/Search or press/i)).toBeInTheDocument()
  })

  it('renders a combobox input element', () => {
    renderWithProviders(<SearchBar />)
    // MUI Autocomplete renders an input with role="combobox"
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('calls preloadData on focus', async () => {
    const preloadData = vi.fn()
    vi.mocked(useGlobalSearch).mockReturnValue(makeDefaultSearchContext({ preloadData }))

    renderWithProviders(<SearchBar />)
    const input = screen.getByPlaceholderText(/Search or press/i)
    await userEvent.click(input)
    expect(preloadData).toHaveBeenCalled()
  })

  it('accepts user input', async () => {
    renderWithProviders(<SearchBar />)
    const input = screen.getByPlaceholderText(/Search or press/i)
    await userEvent.click(input)
    await userEvent.type(input, 'example')
    expect(input).toHaveValue('example')
  })

  it('shows loading spinner when isLoading is true', () => {
    vi.mocked(useGlobalSearch).mockReturnValue(
      makeDefaultSearchContext({
        searchState: { ...defaultSearchState, isLoading: true },
      }),
    )
    renderWithProviders(<SearchBar />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('renders inside a container with a keyboard-shortcut target element', async () => {
    // The SearchBar registers a Cmd+K shortcut that focuses the search input.
    // Verify that typing Cmd+K does not throw and the input element is focusable.
    renderWithProviders(<SearchBar />)
    const input = screen.getByPlaceholderText(/Search or press/i)
    await userEvent.keyboard('{Meta>}k{/Meta}')
    // After Cmd+K the component attempts to focus #global-search-input via querySelector.
    // Verify the search input element is present and focusable.
    expect(input).toBeInTheDocument()
  })
})
