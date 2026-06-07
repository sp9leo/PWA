<template>
  <div>
    <div class="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-none"
      style="-webkit-overflow-scrolling: touch">
      <div v-for="c in radioChannels" :key="c.id"
        class="flex-shrink-0 snap-start card !p-2.5 min-w-36">
        <div class="font-medium text-xs">CH: {{ c.name }}</div>
        <div v-if="c.frequency" class="text-[10px] text-gray-400 font-mono mt-0.5">{{ c.frequency }}</div>
        <div v-if="c.description" class="text-[10px] text-gray-500 mt-0.5 truncate max-w-32">{{ c.description }}</div>
      </div>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h1 class="text-2xl font-bold">Kanban (Tryout)</h1>
      <button @click="openNew" class="btn-primary">
        <span class="text-lg leading-none">+</span> Add Unit
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-2 mb-4">
      <div class="relative w-44">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
        <input v-model="search" class="input-sm !pl-8" placeholder="Search units..." />
      </div>
      <span v-for="s in statuses" :key="s.key" class="chip"
        :class="filterStatus === s.key ? 'chip-active' : 'chip-inactive'"
        @click="filterStatus = filterStatus === s.key ? '' : s.key">
        <span class="w-1.5 h-1.5 rounded-full mr-1.5"
          :style="{ backgroundColor: `var(--status-${s.key})` }" />
        {{ s.label }}
      </span>
    </div>

    <VueDraggable v-model="columnList" group="columns" tag="div" handle=".column-drag-handle"
      class="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none"
      style="-webkit-overflow-scrolling: touch" @end="onColumnReorder">
      <div v-for="col in visibleColumns" :key="col.id"
        class="flex-shrink-0 w-72 md:w-80 snap-start">
        <div class="card !p-0 flex flex-col" :data-status="col.statusKey"
          :style="{ borderTopColor: `var(--status-${col.statusKey})`, borderTopWidth: '3px' }">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700/30">
            <div class="flex items-center gap-2">
              <span class="column-drag-handle cursor-grab active:cursor-grabbing text-gray-500 text-sm select-none">⠿</span>
              <span class="w-2.5 h-2.5 rounded-full"
                :style="{ backgroundColor: `var(--status-${col.statusKey})` }"></span>
              <span class="text-sm font-semibold">{{ col.label }}</span>
              <span class="text-xs text-gray-500 bg-gray-700/50 px-1.5 py-0.5 rounded tabular-nums">
                {{ (grouped[col.statusKey] || []).length }}
              </span>
            </div>
            <button @click="quickAdd(col.statusKey)"
              class="text-gray-400 hover:text-white text-lg leading-none p-1 rounded-lg hover:bg-white/5 transition-colors">+</button>
          </div>
          <VueDraggable v-model="grouped[col.statusKey]" group="kanban" tag="div"
            class="flex-1 p-3 space-y-2 min-h-24"
            @start="isDragging = true" @end="onDragEnd">
            <div v-for="item in grouped[col.statusKey]" :key="item.id">
              <UnitCardTryout :unit="item" @edit="editUnit(item.id)" />
            </div>
            <div v-if="!grouped[col.statusKey]?.length"
              class="text-xs text-gray-500 text-center py-8 pointer-events-none select-none">
              Drop units here
            </div>
          </VueDraggable>
        </div>
      </div>
    </VueDraggable>

    <UnitForm v-if="showForm" :presetStatus="formStatus"
      :editId="editingId" @close="closeForm" />
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useYjs, updateKanbanColumn } from '../composables/useYjs.js'
import UnitCardTryout from '../components/UnitCardTryout.vue'
import UnitForm from '../components/UnitForm.vue'

const { units, radioChannels, kanbanColumns, syncKanbanState } = useYjs()

const showForm = ref(false)
const formStatus = ref('')
const editingId = ref('')
const search = ref('')
const filterStatus = ref('')
const isDragging = ref(false)

const statuses = [
  { key: 'en-route', label: 'En Route' },
  { key: 'on-scene', label: 'On Scene' },
  { key: 'triaged', label: 'Triaged' },
  { key: 'transport', label: 'Transport' },
  { key: 'cleared', label: 'Cleared' },
]

const columnList = ref([])

watch(kanbanColumns, (cols) => {
  columnList.value = [...cols].sort((a, b) => a.order - b.order)
}, { immediate: true })

const visibleColumns = computed(() =>
  filterStatus.value
    ? columnList.value.filter(c => c.statusKey === filterStatus.value)
    : columnList.value
)

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return units.value
  return units.value.filter(u => {
    const unit = (u.unit || '').toLowerCase()
    const loc = (u.location || '').toLowerCase()
    return unit.includes(q) || loc.includes(q)
  })
})

const grouped = reactive({})

function rebuildGrouped(list) {
  const keys = [...new Set(columnList.value.map(c => c.statusKey))]
  for (const k of keys) {
    grouped[k] = list
      .filter(u => u.status === k)
      .sort((a, b) => (a.order ?? -(a.updatedAt || 0)) - (b.order ?? -(b.updatedAt || 0)))
  }
}

watch(filtered, (val) => {
  if (isDragging.value) return
  rebuildGrouped(val)
}, { immediate: true })

function onDragEnd() {
  isDragging.value = false
  const columns = {}
  for (const col of columnList.value) {
    columns[col.statusKey] = (grouped[col.statusKey] || []).map(u => u.id)
  }
  syncKanbanState(columns)
}

function onColumnReorder() {
  columnList.value.forEach((col, index) => {
    updateKanbanColumn(col.id, { order: index })
  })
}

function editUnit(id) {
  editingId.value = id
  formStatus.value = ''
  showForm.value = true
}

function quickAdd(status) {
  editingId.value = ''
  formStatus.value = status
  showForm.value = true
}

function openNew() {
  editingId.value = ''
  formStatus.value = ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = ''
  formStatus.value = ''
}
</script>
