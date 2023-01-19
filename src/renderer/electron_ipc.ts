import { useEffect, useState } from "react"

const ElectronIPC = window.electron.exec
export default ElectronIPC

type ipc = typeof ElectronIPC

type Params<F> =
  F extends (param: infer P) => any ? P : unknown
type Return<F> =
  F extends (param: any) => infer R ? R : unknown

type hook<key extends keyof ipc | string = '', item = key extends keyof ipc ? ipc[key] : any> = (
  opts?: {
      initial?: Params<item> | ( () => Params<item> )
  }
) => [
  null | Awaited<Return<item>>,
  (params: Params<item>) => Return<item>
]

export const useElectron: {
  [key in keyof typeof ElectronIPC]: hook<key>
} = Object.fromEntries(Object.entries(ElectronIPC).map(([channel, handler]) => {
  const hook: hook = (opts) => {
    const [res, setRes] = useState<any>(null)
    const handle = async (params: any) => {
      const out = await handler(params)
      setRes(out)
      return out
    }
    useEffect( () => {
        if(opts?.initial){
          if(typeof opts.initial === 'function')
            handle(opts.initial())
          else
            handle(opts.initial)
        }
    }, [] )
    return [res, handle]
  }
  return [channel, hook]
})) as any
