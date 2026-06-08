<template>
  <div class="card-hover !p-3 touch-manipulation cursor-grab active:cursor-grabbing" :data-id="unit.id">
    <div class="flex items-start justify-between gap-1">
      <div class="min-w-0 flex-1">
        <div class="font-medium text-sm truncate">{{ unit.unit }}</div>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <span class="badge" :class="`status-bg-${unit.status} status-text-${unit.status}`">
          {{ label }}
        </span>
        <button @click="$emit('edit', unit.id)"
          class="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-xs shrink-0">
          &#9998;
        </button>
        <span class="text-gray-500 text-xs select-none touch-none px-0.5 cursor-grab active:cursor-grabbing">&#9776;</span>
      </div>
    </div>

    <div class="text-sm text-gray-400 mt-1 truncate">{{ unit.location }}</div>

    <div v-if="unit.notes" class="text-xs text-gray-500 mt-2 line-clamp-2">{{ unit.notes }}</div>

    <div class="flex justify-between items-end mt-2">
      <div class="text-[10px] text-gray-500 space-y-0.5">
        <div v-if="unit.leader" class="text-gray-600">
          {{ unit.leader }}<span v-if="unit.leaderPhone"> &middot; {{ unit.leaderPhone }}</span>
        </div>
        <div v-if="unit.type">🚒 {{ unit.type }}</div>
        <div v-if="unit.personnelCount">{{ unit.personnelCount }} pers</div>
      </div>
      <div class="text-[10px] text-gray-600">{{ timeOnly }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ unit: Object })
defineEmits(['edit'])

const labels = { 'en-route': 'En Route', 'on-scene': 'On Scene', 'triaged': 'Triaged', 'transport': 'Transport', 'cleared': 'Cleared' }
const label = computed(() => labels[props.unit.status] || props.unit.status)

const timeOnly = computed(() => {
  const d = new Date(props.unit.updatedAt || props.unit.createdAt)
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
})
</script>
