import * as io from 'socket.io';
import { Interaction, Logger } from './session';
export interface ServerOptions {
    port?: number | string;
    logger?: Logger;
}
export declare function listen(interaction: Interaction): io.Server;
export declare function listen(port: number | string, interaction: Interaction): io.Server;
export declare function listen(options: ServerOptions, interaction: Interaction): io.Server;
