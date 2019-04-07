import { Socket } from 'socket.io'
import { Message, MessageHandler, JValue, Action } from './types'
import consoleStamp = require('console-stamp')

interface Sender {
  (data: JValue): Promise<void>
  (type: string, data: JValue): Promise<void>
}

interface Receiver {
  (): Promise<JValue>
  (type: string): Promise<JValue>
}

export interface Interaction {
  (session: Session, receive: Receiver): Promise<any>
}

export interface Session extends Sender {
  send(data: JValue): Promise<void>
  send(type: string, data: JValue): Promise<void>
  receive(): Promise<JValue>
  receive(type: string): Promise<JValue>
}

export interface Logger {
  log(...args: any[]): void
  info(...args: any[]): void
  error(...args: any[]): void
  warn(...args: any[]): void
}

export const consoleLogger: Logger = {
  log(...args: any[]) { console.log(...args) },
  info(...args: any[]) { console.info(...args) },
  error(...args: any[]) { console.error(...args) },
  warn(...args: any[]) { console.warn(...args) }
}

consoleStamp(consoleLogger)

export function createSession(socket: Socket, logger: Logger): Session {
  const socketError = 'Connection has been closed.'
  function protocolError(actual: string, expected: string) {
    return `Message type mismatch, expected '${expected}', got '${actual}'.`
  }

  let closed = false
  const buffer: Array<Message> = []
  const listeners: Array<MessageHandler> = []

  function close() {
    if (closed) {
      return
    }

    logger.info('Closing socket...')
    closed = true
    const error = new Error(socketError)
    for (const [_, reject] of listeners) {
      reject(error)
    }

    listeners.length = 0
    buffer.length = 0
    socket.disconnect(true)
  }

  socket.on('message', function (message: Message, callback: Action<any>) {
    if (closed) {
      return
    }

    logger.info(`Received message`, message)
    callback('message_received')
    if (listeners.length > 0) {
      const { data, type } = message
      const [resolve, reject, expectedType] = listeners.shift() as MessageHandler
      if (type === expectedType) {
        resolve(data)
      } else {
        reject(new Error(protocolError(type, expectedType)))
      }
    } else {
      buffer.push(message)
    }
  })

  socket.on('disconnect', function (reason: string) {
    logger.info(`Disconnected with reason '${reason}'.`)
    if (reason !== 'ping timeout') {
      close()
    }
  })

  socket.on('reconnect_failed', function () {
    close()
  })

  function receive(expectedType: string = 'message'): Promise<JValue> {
    if (closed) {
      return Promise.reject(new Error(socketError))
    }

    if (buffer.length > 0) {
      const { data, type } = buffer.shift() as Message
      if (type === expectedType) {
        return Promise.resolve(data)
      } else {
        return Promise.reject(new Error(protocolError(type, expectedType)))
      }
    } else {
      return new Promise(function (resolve, reject) {
        listeners.push([resolve, reject, expectedType])
      })
    }
  }

  function send(data: JValue): Promise<void>
  function send(type: string, data: JValue): Promise<void>
  function send(type: string | JValue, data?: JValue): Promise<void> {
    if (closed) {
      return Promise.reject(new Error(socketError))
    }

    if (typeof data === 'undefined') {
      data = type
      type = 'message'
    }

    return new Promise(function (resolve, reject) {
      const message: Message = {
        type: type as string,
        data: data as JValue
      }

      logger.info(`Sending message`, message)
      socket.emit('message', message, function (data?: any) {
        if (data === 'message_received') {
          logger.info('Message sent.')
          resolve()
        } else {
          logger.error('Message sending failed.')
          reject(new Error('Invalid acknowledgment.'))
        }
      })
    })
  }

  function session(...args: any[]) {
    return (send as any)(...args)
  }

  session.send = send
  session.receive = receive
  return session
}
