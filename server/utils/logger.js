// Server-side logger utility that only logs when explicitly in development mode
// Default to production behavior unless NODE_ENV is explicitly 'development'
const isDevelopment = process.env.NODE_ENV === 'development'

const noop = () => {}

const logger = {
  log: isDevelopment ? console.log.bind(console) : noop,
  info: isDevelopment ? console.info.bind(console) : noop,
  warn: isDevelopment ? console.warn.bind(console) : noop,
  error: console.error.bind(console), // Always log errors
  debug: isDevelopment ? console.debug.bind(console) : noop,
}

// Always log important server information
logger.server = console.log.bind(console)

module.exports = logger