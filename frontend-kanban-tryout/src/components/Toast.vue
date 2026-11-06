<template>
  <Teleport to="body">
    <div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div v-for="t in toasts" :key="t.id"
          class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold bg-white border-2 transition-all"
          :class="toastClass(t.type)">
          <span v-html="icon(t.type)"></span>
          <span>{{ t.message }}</span>
          <button @click="remove(t.id)" class="ml-2 opacity-50 hover:opacity-100">&times;</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '../composables/useToast.js'

const { toasts, remove } = useToast()

function icon(type) {
  const icons = { success: '&#10003;', error: '&#10007;', info: '&#9432;' }
  return icons[type] || icons.info
}

function toastClass(type) {
  const map = {
    success: 'border-green-200 text-green-700',
    error: 'border-red-200 text-red-700',
    info: 'border-gray-200 text-gray-700',
  }
  return map[type] || map.info
}
</script>

<style scoped>
.toast-enter-active { transition: all 0.25s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from { opacity: 0; transform: translateY(20px) scale(0.95); }
.toast-leave-to { opacity: 0; transform: translateY(-10px) scale(0.95); }
</style>
