import * as io from 'socket.io-client'
import { Interaction, createSession, Logger, consoleLogger } from './session'

export interface ClientOptions {
  address: string,
  logger?: Logger
}

export function connect(address: string, interaction: Interaction): Promise<any>
export function connect(options: ClientOptions, interaction: Interaction): Promise<any>
export function connect(arg: string | ClientOptions, interaction: Interaction): Promise<any> {
  let address: string
  let logger: Logger
  if (typeof arg === 'string') {
    address = arg
    logger = consoleLogger
  } else {
    address = arg.address
    logger = arg.logger || consoleLogger
  }

  return new Promise(function (resolve, reject) {
    logger.info(`Connecting to '${address}'...`)
    const socket = io(address, {
      forceNew: true,
      autoConnect: false
    })

    socket.on('connect_error', function () {
      logger.error(`Error connecting to '${address}'.`)
    })

    socket.once('connect', async function () {
      logger.info(`Connected to ${address}.`)
      const session = createSession(socket as any, logger)
      try {
        const result = await interaction(session, session.receive)
        resolve(result)
      } catch (e) {
        reject(e)
      } finally {
        socket.disconnect()
        logger.info(`Closed session with '${address}'.`)
      }
    })

    socket.open()
  })
}
