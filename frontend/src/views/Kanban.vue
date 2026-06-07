<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h1 class="text-2xl font-bold">Kanban</h1>
      <button @click="showForm = true" class="btn-primary">
        <span class="text-lg leading-none">+</span> Add Unit
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-2 mb-4">
      <div class="relative flex-1 min-w-40 max-w-xs">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">&#128269;</span>
        <input v-model="search" class="input-sm !pl-8" placeholder="Search units..." />
      </div>
      <span v-for="s in statuses" :key="s.key"
        class="chip"
        :class="filterStatus === s.key ? 'chip-active' : 'chip-inactive'"
        @click="filterStatus = filterStatus === s.key ? '' : s.key">
        <span class="w-1.5 h-1.5 rounded-full mr-1.5" :style="{ backgroundColor: `var(--status-${s.key})` }"></span>
        {{ s.label }}
      </span>
    </div>

    <div class="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none" style="-webkit-overflow-scrolling: touch">
      <div v-for="s in statuses" :key="s.key"
        class="flex-shrink-0 w-72 md:w-80 snap-start"
        :class="{ 'opacity-40': filterStatus && filterStatus !== s.key }">
        <KanbanColumn :key="`col-${s.key}-${version}`" :status="s.key" :label="s.label" :units="grouped[s.key] || []"
          @add="showFormWithStatus = s.key; showForm = true"
          @edit="editUnit" />
      </div>
    </div>

    <UnitForm v-if="showForm" :presetStatus="showFormWithStatus" :editId="editingId" @close="closeForm" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useYjs } from '../composables/useYjs.js'
import KanbanColumn from '../components/KanbanColumn.vue'
import UnitForm from '../components/UnitForm.vue'

const { units, STATUSES, version } = useYjs()
const showForm = ref(false)
const showFormWithStatus = ref('')
const editingId = ref('')
const search = ref('')
const filterStatus = ref('')

const statuses = [
  { key: 'en-route', label: 'En Route' },
  { key: 'on-scene', label: 'On Scene' },
  { key: 'triaged', label: 'Triaged' },
  { key: 'transport', label: 'Transport' },
  { key: 'cleared', label: 'Cleared' },
]

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return units.value
  return units.value.filter(u =>
    u.unit.toLowerCase().includes(q) || u.location.toLowerCase().includes(q)
  )
})

const grouped = computed(() => {
  const g = {}
  for (const s of STATUSES) g[s] = []
  for (const u of filtered.value) {
    if (g[u.status]) g[u.status].push(u)
  }
  for (const s of STATUSES) {
    g[s].sort((a, b) => b.updatedAt - a.updatedAt)
  }
  return g
})

function editUnit(id) {
  editingId.value = id
  showFormWithStatus.value = ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = ''
}
</script>
