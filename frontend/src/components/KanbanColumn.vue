<template>
  <div class="card !p-0 flex flex-col" :data-status="status" :style="{ borderTopColor: `var(--status-${status})`, borderTopWidth: '3px' }">
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700/30">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: `var(--status-${status})` }"></span>
        <span class="text-sm font-semibold">{{ label }}</span>
        <span class="text-xs text-gray-500 bg-gray-700/50 px-1.5 py-0.5 rounded tabular-nums">{{ localItems.length }}</span>
      </div>
      <button @click="$emit('add')" class="text-gray-400 hover:text-white text-lg leading-none p-1 rounded-lg hover:bg-white/5 transition-colors">&plus;</button>
    </div>
    <VueDraggable v-model="localItems" :options="dragOptions" @end="onEnd"
      class="flex-1 p-3 space-y-2 overflow-y-auto min-h-24">
      <div v-for="u in localItems" :key="u.id" :data-id="u.id">
        <UnitCard :unit="u" @edit="(id) => $emit('edit', id)" />
      </div>
      <template #footer>
        <div v-if="localItems.length === 0" class="text-xs text-gray-500 text-center py-8 pointer-events-none">
          Drop units here
        </div>
      </template>
    </VueDraggable>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import UnitCard from './UnitCard.vue'
import { syncKanbanState } from '../composables/useYjs.js'
import { useToast } from '../composables/useToast.js'

const props = defineProps({
  status: String,
  label: String,
  units: Array,
})

defineEmits(['add', 'edit'])

const { add: addToast } = useToast()

const localItems = ref([])

watch(() => props.units, (val) => {
  localItems.value = [...val]
}, { immediate: true })

const dragOptions = {
  group: 'kanban',
  animation: 200,
  touchStartThreshold: 5,
  delay: 100,
  delayOnTouchOnly: true,
}

function onEnd() {
  const columns = {}
  document.querySelectorAll('[data-status]').forEach(col => {
    const s = col.dataset.status
    const ids = [...col.querySelectorAll('[data-id]')].map(el => el.dataset.id).filter(Boolean)
    if (ids.length) columns[s] = ids
  })
  syncKanbanState(columns)
  addToast('Board updated', 'info')
}
</script>
