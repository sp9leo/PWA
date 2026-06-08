<template>
  <div class="card-hover !p-3 touch-manipulation cursor-grab active:cursor-grabbing" :data-id="unit.id">
    <div class="flex items-start justify-between gap-1">
      <div class="min-w-0 flex-1">
        <div class="font-medium text-sm truncate">{{ unit.unit }}</div>
        <div v-if="unit.type" class="text-[10px] text-gray-500 mt-0.5 font-mono">{{ unit.type }}</div>
        <div class="text-xs text-gray-400 mt-0.5 truncate">{{ unit.location }}</div>
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
    <div v-if="unit.notes" class="text-xs text-gray-500 mt-2 line-clamp-2">{{ unit.notes }}</div>
    <div v-if="unit.leader" class="text-[10px] text-gray-600 mt-1">
      {{ unit.leader }}<span v-if="unit.leaderPhone"> &middot; {{ unit.leaderPhone }}</span>
    </div>
    <div v-if="unit.personnelCount" class="text-[10px] text-gray-600">
      {{ unit.personnelCount }} {{ unit.personnelCount === 1 ? 'person' : 'personnel' }}
    </div>
    <div class="text-[10px] text-gray-600 mt-1.5">{{ time }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ unit: Object })
defineEmits(['edit'])

const labels = { 'en-route': 'En Route', 'on-scene': 'On Scene', 'triaged': 'Triaged', 'transport': 'Transport', 'cleared': 'Cleared' }
const label = computed(() => labels[props.unit.status] || props.unit.status)

const time = computed(() => {
  const d = new Date(props.unit.updatedAt || props.unit.createdAt)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return sameDay ? time : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + time
})
</script>
