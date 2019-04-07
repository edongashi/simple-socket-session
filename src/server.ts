import * as io from 'socket.io'
import { Interaction, createSession, Logger, consoleLogger } from './session'

export interface ServerOptions {
  port?: number | string
  logger?: Logger
}

export function listen(interaction: Interaction): io.Server
export function listen(port: number | string, interaction: Interaction): io.Server
export function listen(options: ServerOptions, interaction: Interaction): io.Server
export function listen(arg: number | string | ServerOptions | Interaction, interaction?: Interaction): io.Server {
  let port: number | string = 80
  let logger: Logger = consoleLogger
  let interactionValue: Interaction

  if (interaction) {
    interactionValue = interaction
    if (typeof arg === 'string' || typeof arg === 'number') {
      port = arg
    } else if (typeof arg === 'object') {
      port = (arg as ServerOptions).port || 80
      logger = (arg as ServerOptions).logger || consoleLogger
    }
  } else if (typeof arg === 'function') {
    interactionValue = arg
  } else {
    throw new Error('Expected interaction argument.')
  }

  const app = io(port)

  logger.info(`Started listening on port ${port}...`)
  app.on('connection', async function (socket) {
    logger.info(`Established connection with '${socket.handshake.address}'.`)
    const session = createSession(socket, logger)
    try {
      await interactionValue(session, session.receive)
    } catch (e) {
      throw e
    } finally {
      socket.disconnect(true)
      logger.info(`Closed session with '${socket.handshake.address}'.`)
    }
  })

  return app
}
