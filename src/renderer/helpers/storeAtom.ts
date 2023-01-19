import { atom, WritableAtom } from "jotai"

export const createStoreAtom: <T>(key: string, def?: T) => WritableAtom<T | null, T, void> = (key, def) => {
  const strAtom = atom<any>(window.electron.store.get(key) ?? def)

  const strAtomWithPersistence = atom(
    (get) => get(strAtom),
    (_get, set, newStr) => {
      set(strAtom, newStr)
      window.electron.store.set(key, newStr)
    }
  )

  return strAtomWithPersistence
}
