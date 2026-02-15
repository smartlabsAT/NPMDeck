import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('logger', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('should export a default logger object with all expected methods', async () => {
    const { default: logger } = await import('../logger')
    const expectedMethods = ['log', 'info', 'warn', 'error', 'debug', 'group', 'groupEnd', 'table']

    for (const method of expectedMethods) {
      expect(logger).toHaveProperty(method)
      expect(typeof logger[method as keyof typeof logger]).toBe('function')
    }
  })

  it('should have error method that calls console.error regardless of mode', async () => {
    // Spy before importing so the bound reference captures the spy
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Reset modules so logger re-binds console.error to our spy
    vi.resetModules()
    const { default: logger } = await import('../logger')

    logger.error('test error message')
    expect(errorSpy).toHaveBeenCalledWith('test error message')

    errorSpy.mockRestore()
  })

  it('should not throw when calling any method', async () => {
    const { default: logger } = await import('../logger')

    // Suppress any console output during this test
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    vi.spyOn(console, 'group').mockImplementation(() => {})
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
    vi.spyOn(console, 'table').mockImplementation(() => {})

    expect(() => logger.log('test')).not.toThrow()
    expect(() => logger.info('test')).not.toThrow()
    expect(() => logger.warn('test')).not.toThrow()
    expect(() => logger.error('test')).not.toThrow()
    expect(() => logger.debug('test')).not.toThrow()
    expect(() => logger.group('test')).not.toThrow()
    expect(() => logger.groupEnd()).not.toThrow()
    expect(() => logger.table([{ a: 1 }])).not.toThrow()

    vi.restoreAllMocks()
  })
})
