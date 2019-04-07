import { Interaction, Logger } from './session';
export interface ClientOptions {
    address: string;
    logger?: Logger;
}
export declare function connect(address: string, interaction: Interaction): Promise<any>;
export declare function connect(options: ClientOptions, interaction: Interaction): Promise<any>;
