import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, userEvent, waitFor, resetAuthStore } from '../../test/utils'
import Login from '../../pages/Login'
import { authApi } from '../../api/auth'
import { mockUser } from '../../test/fixtures'

vi.mock('../../api/auth', () => ({
  authApi: {
    login: vi.fn(),
    getMe: vi.fn(),
    refreshToken: vi.fn(),
    logout: vi.fn(),
  },
}))

// Build a minimal valid JWT: header.payload.sig so getTokenExpiry doesn't warn
function makeMockToken(expiresInSeconds = 3600): string {
  const payload = { exp: Math.floor(Date.now() / 1000) + expiresInSeconds }
  return `header.${btoa(JSON.stringify(payload))}.sig`
}

describe('Login integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAuthStore()
    // refreshToken is called automatically after login; prevent it from erroring
    vi.mocked(authApi.refreshToken).mockResolvedValue({ token: makeMockToken(), expires: '2027-01-01' })
  })

  it('submits credentials and calls authApi.login', async () => {
    const mockToken = makeMockToken()
    vi.mocked(authApi.login).mockResolvedValue({ token: mockToken, expires: '2027-01-01' })
    vi.mocked(authApi.getMe).mockResolvedValue(mockUser())

    renderWithProviders(<Login />, { initialRoute: '/login' })

    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        identity: 'test@example.com',
        secret: 'password123',
      })
    })
  })

  it('shows error message on invalid credentials', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'))

    renderWithProviders(<Login />, { initialRoute: '/login' })

    await userEvent.type(screen.getByLabelText(/email address/i), 'wrong@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'bad')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })

  it('disables submit button while login is pending', async () => {
    // Never resolves — simulates an in-flight request
    vi.mocked(authApi.login).mockImplementation(() => new Promise(() => {}))

    renderWithProviders(<Login />, { initialRoute: '/login' })

    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'pwd123')
    const button = screen.getByRole('button', { name: /sign in/i })
    await userEvent.click(button)

    await waitFor(() => {
      expect(button).toBeDisabled()
    })
  })
})
