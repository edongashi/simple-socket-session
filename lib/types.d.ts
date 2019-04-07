export declare type JValue = string | number | boolean | JObject | JArray | null;
export interface JObject {
    [key: string]: JValue;
}
export interface JArray extends Array<JValue> {
}
export declare type Action<TArg> = (arg: TArg) => void;
export declare type MessageHandler = [Action<JValue>, Action<Error>, string];
export declare type Message = {
    type: string;
    data: JValue;
};
