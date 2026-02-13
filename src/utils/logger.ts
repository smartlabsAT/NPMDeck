// Logger utility that only logs when explicitly in development mode
// Default to production behavior unless NODE_ENV is explicitly 'development'
const isDevelopment = import.meta.env.MODE === 'development'

interface Logger {
  log: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  debug: (...args: unknown[]) => void
  group: (...args: unknown[]) => void
  groupEnd: () => void
  table: (data: Record<string, unknown> | unknown[]) => void
}

const noop = (): void => {}

const logger: Logger = {
  log: isDevelopment ? console.log.bind(console) : noop,
  info: isDevelopment ? console.info.bind(console) : noop,
  warn: isDevelopment ? console.warn.bind(console) : noop,
  error: console.error.bind(console), // Always log errors
  debug: isDevelopment ? console.debug.bind(console) : noop,
  group: isDevelopment ? console.group.bind(console) : noop,
  groupEnd: isDevelopment ? console.groupEnd.bind(console) : noop,
  table: isDevelopment ? console.table.bind(console) : noop,
}

export default logger