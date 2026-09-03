import { reactive, readonly } from 'vue'

interface ToastState {
  message: string
  green: boolean
  visible: boolean
}

const state = reactive<ToastState>({ message: '', green: false, visible: false })

let timer: ReturnType<typeof setTimeout> | null = null

export function showToast(message: string, options: { green?: boolean; duration?: number } = {}) {
  state.message = message
  state.green = options.green ?? false
  state.visible = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    state.visible = false
  }, options.duration ?? 2200)
}

export function useToast() {
  return readonly(state)
}
