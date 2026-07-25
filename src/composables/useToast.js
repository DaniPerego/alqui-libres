import { ref } from 'vue'

const toasts = ref([])
let nextId = 0

export function useToast() {
  const show = (message, type = 'success', duration = 4000) => {
    const id = ++nextId
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  return { toasts, show }
}
