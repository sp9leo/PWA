<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h1 class="text-2xl font-bold">All Units</h1>
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
      <span class="chip chip-inactive text-xs" @click="showFilters = !showFilters">&#9660; Sort</span>
    </div>

    <div v-if="showFilters" class="flex flex-wrap items-center gap-2 mb-4 p-3 card text-xs">
      <span class="text-gray-400">Sort by:</span>
      <span v-for="col in sortableColumns" :key="col.key"
        class="chip"
        :class="sortBy === col.key ? 'chip-active' : 'chip-inactive'"
        @click="toggleSort(col.key)">
        {{ col.label }}
        <span v-if="sortBy === col.key" class="ml-1">{{ sortDir === 'asc' ? '&#9650;' : '&#9660;' }}</span>
      </span>
    </div>

    <div class="card overflow-hidden !p-0">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-700/50 text-gray-400 text-xs uppercase tracking-wider">
              <th class="text-left px-4 py-3 font-medium cursor-pointer select-none hover:text-white transition-colors" @click="toggleSort('unit')">
                Unit <span v-if="sortBy === 'unit'" class="ml-1">{{ sortDir === 'asc' ? '&#9650;' : '&#9660;' }}</span>
              </th>
              <th class="text-left px-4 py-3 font-medium hidden sm:table-cell cursor-pointer select-none hover:text-white transition-colors" @click="toggleSort('location')">
                Location <span v-if="sortBy === 'location'" class="ml-1">{{ sortDir === 'asc' ? '&#9650;' : '&#9660;' }}</span>
              </th>
              <th class="text-left px-4 py-3 font-medium cursor-pointer select-none hover:text-white transition-colors" @click="toggleSort('status')">
                Status <span v-if="sortBy === 'status'" class="ml-1">{{ sortDir === 'asc' ? '&#9650;' : '&#9660;' }}</span>
              </th>
              <th class="text-left px-4 py-3 font-medium hidden md:table-cell">Notes</th>
              <th class="text-left px-4 py-3 font-medium hidden lg:table-cell cursor-pointer select-none hover:text-white transition-colors" @click="toggleSort('updatedAt')">
                Updated <span v-if="sortBy === 'updatedAt'" class="ml-1">{{ sortDir === 'asc' ? '&#9650;' : '&#9660;' }}</span>
              </th>
              <th class="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in sorted" :key="u.id"
              class="border-b border-gray-700/30 hover:bg-white/5 transition-colors">
              <td class="px-4 py-3">
                <div class="font-medium">{{ u.unit }}</div>
                <div class="text-xs text-gray-500 sm:hidden">{{ u.location }}</div>
              </td>
              <td class="px-4 py-3 text-gray-400 hidden sm:table-cell max-w-32 truncate">{{ u.location }}</td>
              <td class="px-4 py-3">
                <select :value="u.status" @change="moveUnit(u.id, $event.target.value)"
                  class="bg-gray-700/50 border border-gray-600 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer">
                  <option v-for="s in STATUSES" :key="s" :value="s">{{ statusLabel(s) }}</option>
                </select>
              </td>
              <td class="px-4 py-3 text-gray-400 max-w-40 truncate hidden md:table-cell">{{ u.notes || '—' }}</td>
              <td class="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell whitespace-nowrap">{{ formatTime(u.updatedAt || u.createdAt) }}</td>
              <td class="px-4 py-3 text-right whitespace-nowrap">
                <button @click="editUnit(u.id)" class="btn-ghost btn-sm !px-2 text-gray-400 hover:text-white" title="Edit">&#9998;</button>
                <button @click="confirmDelete(u)" class="btn-ghost btn-sm !px-2 text-red-400 hover:text-red-300" title="Delete">&#10005;</button>
              </td>
            </tr>
            <tr v-if="sorted.length === 0">
              <td colspan="6" class="px-4 py-12 text-center text-gray-500">
                <div class="flex flex-col items-center gap-2">
                  <span class="text-3xl">&#128260;</span>
                  <p class="text-sm">{{ search || filterStatus ? 'No matching units' : 'No units yet' }}</p>
                  <button v-if="!search && !filterStatus" @click="showForm = true" class="btn-primary btn-sm mt-2">
                    Add your first unit
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <UnitForm v-if="showForm && !editingId" @close="showForm = false" />
    <UnitForm v-if="showForm && editingId" :editId="editingId" @close="closeForm" />

    <ConfirmModal v-if="deleteTarget"
      title="Remove Unit"
      :message="`Remove ${deleteTarget.unit}? This cannot be undone.`"
      confirmText="Remove"
      variant="danger"
      @confirm="doDelete"
      @cancel="deleteTarget = null" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useYjs, moveUnit as doMove, removeUnit as doRemove } from '../composables/useYjs.js'
import { useToast } from '../composables/useToast.js'
import UnitForm from '../components/UnitForm.vue'
import ConfirmModal from '../components/ConfirmModal.vue'

const { units, STATUSES } = useYjs()
const { add: addToast } = useToast()

const showForm = ref(false)
const editingId = ref('')
const search = ref('')
const filterStatus = ref('')
const sortBy = ref('updatedAt')
const sortDir = ref('desc')
const showFilters = ref(false)
const deleteTarget = ref(null)

const statuses = [
  { key: 'en-route', label: 'En Route' },
  { key: 'on-scene', label: 'On Scene' },
  { key: 'triaged', label: 'Triaged' },
  { key: 'transport', label: 'Transport' },
  { key: 'cleared', label: 'Cleared' },
]

const sortableColumns = [
  { key: 'unit', label: 'Unit' },
  { key: 'location', label: 'Location' },
  { key: 'status', label: 'Status' },
  { key: 'updatedAt', label: 'Updated' },
]

function toggleSort(col) {
  if (sortBy.value === col) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = col
    sortDir.value = 'asc'
  }
}

const filtered = computed(() => {
  let list = [...units.value]
  const q = search.value.toLowerCase().trim()
  if (q) {
    list = list.filter(u =>
      u.unit.toLowerCase().includes(q) || u.location.toLowerCase().includes(q)
    )
  }
  if (filterStatus.value) {
    list = list.filter(u => u.status === filterStatus.value)
  }
  list.sort((a, b) => {
    const aVal = a[sortBy.value] ?? ''
    const bVal = b[sortBy.value] ?? ''
    const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal
    return sortDir.value === 'asc' ? cmp : -cmp
  })
  return list
})

const sorted = computed(() => filtered.value)

const statusLabel = (s) => statuses.find(st => st.key === s)?.label || s

function moveUnit(id, status) {
  doMove(id, status)
  addToast(`Status updated to ${statusLabel(status)}`, 'info')
}

function editUnit(id) {
  editingId.value = id
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = ''
}

function confirmDelete(u) {
  deleteTarget.value = u
}

function doDelete() {
  if (deleteTarget.value) {
    doRemove(deleteTarget.value.id)
    addToast(`${deleteTarget.value.unit} removed`, 'success')
    deleteTarget.value = null
  }
}

function formatTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  if (sameDay) return time
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + time
}
</script>
