import pino from 'pino'

export const logger = pino({
  level: 'debug',
  prettyPrint: {colorize: true, translateTime: true, ignore: 'pid,hostname'}
})
