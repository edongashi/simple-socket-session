export type JValue = string | number | boolean | JObject | JArray | null

export interface JObject {
  [key: string]: JValue
}

export interface JArray extends Array<JValue> { }

export type Action<TArg> = (arg: TArg) => void

export type MessageHandler = [Action<JValue>, Action<Error>, string]

export type Message = {
  type: string,
  data: JValue
}
