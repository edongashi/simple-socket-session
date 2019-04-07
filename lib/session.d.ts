import { Socket } from 'socket.io';
import { JValue } from './types';
interface Sender {
    (data: JValue): Promise<void>;
    (type: string, data: JValue): Promise<void>;
}
interface Receiver {
    (): Promise<JValue>;
    (type: string): Promise<JValue>;
}
export interface Interaction {
    (session: Session, receive: Receiver): Promise<any>;
}
export interface Session extends Sender {
    send(data: JValue): Promise<void>;
    send(type: string, data: JValue): Promise<void>;
    receive(): Promise<JValue>;
    receive(type: string): Promise<JValue>;
}
export interface Logger {
    log(...args: any[]): void;
    info(...args: any[]): void;
    error(...args: any[]): void;
    warn(...args: any[]): void;
}
export declare const consoleLogger: Logger;
export declare function createSession(socket: Socket, logger: Logger): Session;
export {};
