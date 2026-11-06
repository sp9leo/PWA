import { ref } from 'vue'

const toasts = ref([])
let counter = 0

export function useToast() {
  function add(message, type = 'info', duration = 3500) {
    const id = ++counter
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  function remove(id) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { toasts, add, remove }
}
