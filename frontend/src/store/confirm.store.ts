import { create } from 'zustand'

interface ConfirmState {
  open: boolean
  message: string
  resolve: ((value: boolean) => void) | null
  ask: (message: string) => Promise<boolean>
  settle: (value: boolean) => void
}

// Imperative confirm() replacement: `await confirmDialog('Удалить услугу?')` resolves
// true/false once the user answers the modal, rendered once via <ConfirmDialogHost />.
export const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  message: '',
  resolve: null,
  ask: (message) =>
    new Promise<boolean>((resolve) => {
      set({ open: true, message, resolve })
    }),
  settle: (value) => {
    get().resolve?.(value)
    set({ open: false, resolve: null })
  },
}))

export const confirmDialog = (message: string) => useConfirmStore.getState().ask(message)
