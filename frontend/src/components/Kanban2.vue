<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h1 class="text-2xl font-bold">Kanban</h1>

      <button 
        @click="openNew" 
        class="btn-primary"
        type="button"
      >
        <span class="text-lg leading-none">+</span> Add Unit
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-2 mb-4">
      <div class="relative flex-1 min-w-40 max-w-xs">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" aria-hidden="true">
          🔍
        </span>
        <input
          v-model="search"
          class="input-sm !pl-8"
          placeholder="Search units..."
          type="search"
          @keydown.esc="search = ''"
        />
      </div>

      <button
        v-for="s in statuses"
        :key="s.key"
        type="button"
        class="chip"
        :class="filterStatus === s.key ? 'chip-active' : 'chip-inactive'"
        @click="toggleFilter(s.key)"
      >
        <span
          class="w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0"
          :style="{ backgroundColor: `var(--status-${s.key})` }"
        />
        {{ s.label }}
      </button>
    </div>

    <div class="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none">
      <div
        v-for="s in visibleStatuses"
        :key="s.key"
        class="flex-shrink-0 w-72 md:w-80 snap-start flex flex-col"
      >
        <h2 class="mb-2 text-sm font-semibold text-gray-400">
          {{ s.label }}
        </h2>

        <Draggable
          v-model="grouped[s.key]"
          :group="{ name: 'units', pull: true, put: true }"
          item-key="id"
          animation="200"
          class="space-y-2 min-h-[150px] rounded-lg transition-colors duration-150 backend-dropzone"
          ghost-class="sortable-ghost"
          @start="handleDragStart"
          @end="handleDragEnd"
        >
          <template #item="{ element }">
            <KanbanItem :unit="element" @edit="editUnit(element.id)" />
          </template>
        </Draggable>
      </div>
    </div>

    <div
      v-if="filtered.length === 0"
      class="text-gray-500 text-sm mt-4 text-center py-8 border border-dashed border-gray-200 rounded-lg"
    >
      No units found
    </div>

    <UnitForm
      v-if="showForm"
      :presetStatus="showFormWithStatus"
      :editId="editingId"
      @close="closeForm"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Draggable from 'vuedraggable'

import { useYjs } from '../composables/useYjs.js'
import KanbanItem from '../components/KanbanItem.vue'
import UnitForm from '../components/UnitForm.vue'

const { units, syncKanbanState } = useYjs()

/* ------------------ UI STATE ------------------ */

const showForm = ref(false)
const showFormWithStatus = ref('')
const editingId = ref('')
const search = ref('')
const filterStatus = ref('')

const isDragging = ref(false)

/* ------------------ STATUSES ------------------ */

const statuses = [
  { key: 'en-route', label: 'En Route' },
  { key: 'on-scene', label: 'On Scene' },
  { key: 'triaged', label: 'Triaged' },
  { key: 'transport', label: 'Transport' },
  { key: 'cleared', label: 'Cleared' },
]

const visibleStatuses = computed(() =>
  filterStatus.value
    ? statuses.filter(s => s.key === filterStatus.value)
    : statuses
)

/* ------------------ FILTER ------------------ */

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return units.value

  return units.value.filter(u => {
    const unitName = (u.unit || '').toLowerCase()
    const loc = (u.location || '').toLowerCase()
    return unitName.includes(q) || loc.includes(q)
  })
})

/* ------------------ GROUPED STATE ------------------ */

// Changed from reactive to ref to ensure reliable root mutations and drag updates
const grouped = ref({})

function rebuildGrouped(list) {
  const nextGrouped = {}
  
  for (const s of statuses) {
    nextGrouped[s.key] = []
  }

  for (const u of list) {
    if (nextGrouped[u.status]) {
      nextGrouped[u.status].push(u)
    }
  }

  for (const key in nextGrouped) {
    nextGrouped[key].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  }

  grouped.value = nextGrouped
}

watch(
  filtered,
  (newList) => {
    if (isDragging.value) return
    rebuildGrouped(newList)
  },
  { immediate: true, deep: true }
)

/* ------------------ DRAG ------------------ */

function handleDragStart() {
  isDragging.value = true
}

function handleDragEnd() {
  isDragging.value = false

  const columns = {}
  for (const s of statuses) {
    columns[s.key] = (grouped.value[s.key] || []).map(u => u.id)
  }

  syncKanbanState(columns)
}

/* ------------------ ACTIONS ------------------ */

function openNew() {
  showForm.value = true
  showFormWithStatus.value = ''
}

function editUnit(id) {
  editingId.value = id
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = ''
}

function toggleFilter(key) {
  filterStatus.value = filterStatus.value === key ? '' : key
}
</script>

<style>
.sortable-ghost {
  opacity: 0.3;
  filter: grayscale(0.5);
}

/* Enhances UI clarity on empty drop columns when dragging items around */
.backend-dropzone:empty {
  background-color: rgba(243, 244, 246, 0.5);
  border: 2px dashed rgba(209, 213, 219, 0.8);
}
</style>