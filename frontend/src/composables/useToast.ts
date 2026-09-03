import { reactive, readonly } from 'vue'

export interface ToastAction {
  label: string
  handler: () => void
}

interface ToastState {
  message: string
  green: boolean
  visible: boolean
  action: ToastAction | null
}

const state = reactive<ToastState>({
  message: '',
  green: false,
  visible: false,
  action: null,
})

let timer: ReturnType<typeof setTimeout> | null = null

export function showToast(
  message: string,
  options: { green?: boolean; duration?: number; action?: ToastAction } = {},
) {
  state.message = message
  state.green = options.green ?? false
  state.action = options.action ?? null
  state.visible = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(
    () => {
      state.visible = false
      state.action = null
    },
    options.duration ?? (options.action ? 6000 : 2200),
  )
}

export function hideToast() {
  if (timer) clearTimeout(timer)
  state.visible = false
  state.action = null
}

export function useToast() {
  return readonly(state)
}
