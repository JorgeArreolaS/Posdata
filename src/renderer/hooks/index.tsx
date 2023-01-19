import { atom, useAtomValue } from "jotai";
import type { Toast } from 'primereact/toast'

export const toastAtom = atom<null | Toast>(null)
export const useToast = () => useAtomValue(toastAtom)
