<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center" @click.self="$emit('cancel')">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div class="relative bg-gray-800 rounded-2xl p-6 shadow-2xl w-full max-w-sm mx-4 animate-pop">
        <div class="text-center">
          <div class="text-3xl mb-3" v-html="icon"></div>
          <h3 class="text-lg font-bold mb-2">{{ title }}</h3>
          <p class="text-sm text-gray-400 mb-6">{{ message }}</p>
        </div>
        <div class="flex gap-3">
          <button @click="$emit('cancel')" class="btn-ghost flex-1">Cancel</button>
          <button @click="$emit('confirm')" class="flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all active:scale-95 cursor-pointer"
            :class="confirmClass">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Are you sure?' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: 'Confirm' },
  variant: { type: String, default: 'danger' },
  icon: { type: String, default: '&#9888;' },
})

defineEmits(['confirm', 'cancel'])

const confirmClass = 'bg-red-600 text-white hover:bg-red-700'
</script>

<style scoped>
.animate-pop {
  animation: pop 0.2s ease-out;
}
@keyframes pop {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
