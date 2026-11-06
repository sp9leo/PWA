<template>
  <div>
    <div class="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-none"
      style="-webkit-overflow-scrolling: touch">
      <div v-for="c in radioChannels" :key="c.id"
        class="flex-shrink-0 snap-start card !p-3 min-w-44">
        <div class="font-bold text-sm text-gray-900">CH: {{ c.name }}</div>
        <div v-if="c.frequency" class="text-xs font-semibold text-gray-700 font-mono mt-0.5">{{ c.frequency }}</div>
        <div v-if="c.description" class="text-xs text-gray-600 mt-0.5 truncate max-w-40">{{ c.description }}</div>
      </div>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h1 class="text-2xl font-bold text-gray-900">Kanban (Tryout)</h1>
      <div class="flex items-center gap-2">
        <div class="inline-flex items-center gap-0.5 bg-white border border-gray-300 rounded-lg p-0.5 shadow-sm"
          role="tablist" aria-label="View mode">
          <button v-for="mode in viewModes" :key="mode.value" @click="setView(mode.value)"
            role="tab" :aria-selected="view === mode.value"
            class="px-3 py-1.5 rounded-md text-sm font-semibold transition-colors"
            :class="view === mode.value ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'">
            {{ mode.label }}
          </button>
        </div>
        <button @click="openNew" class="btn-primary">
          <span class="text-lg leading-none">+</span> Add Unit
        </button>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2 mb-4">
      <div class="relative w-64">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">🔍</span>
        <input v-model="search" class="input-sm !pl-8 !pr-8"
          placeholder="Search all card fields..." />
        <button v-if="search" @click="search = ''" title="Clear search"
          class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 leading-none">
          &times;
        </button>
      </div>
      <span v-for="s in statuses" :key="s.key" class="chip"
        :class="filterStatus === s.key ? 'chip-active' : 'chip-inactive'"
        @click="filterStatus = filterStatus === s.key ? '' : s.key">
        <span class="w-2 h-2 rounded-full mr-1.5"
          :style="{ backgroundColor: `var(--status-${s.key})` }" />
        {{ s.label }}
      </span>
    </div>

    <template v-if="view === 'board'">
      <VueDraggable v-model="columnList" group="columns" tag="div" handle=".column-drag-handle"
        class="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none"
        style="-webkit-overflow-scrolling: touch" @end="onColumnReorder">
        <div v-for="col in visibleColumns" :key="col.id"
          class="flex-shrink-0 w-72 md:w-80 snap-start">
          <div class="bg-gray-100 border border-gray-200 rounded-xl flex flex-col" :data-status="col.statusKey"
            :style="{ borderTopColor: `var(--status-${col.statusKey})`, borderTopWidth: '4px' }">
            <div class="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-300 bg-white rounded-t-xl">
              <div class="flex items-center gap-2 min-w-0">
                <span class="column-drag-handle cursor-grab active:cursor-grabbing text-gray-500 text-base select-none">⠿</span>
                <span class="w-3 h-3 rounded-full shrink-0"
                  :style="{ backgroundColor: `var(--status-${col.statusKey})` }"></span>
                <span class="text-base font-bold text-gray-900 truncate">{{ statusLabels[col.statusKey] || col.label }}</span>
                <span class="text-sm font-bold text-gray-900 bg-gray-200 px-2 py-0.5 rounded-md tabular-nums shrink-0">
                  {{ (grouped[col.statusKey] || []).length }}
                </span>
              </div>
              <button @click="quickAdd(col.statusKey)"
                class="w-8 h-8 shrink-0 flex items-center justify-center bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 text-xl leading-none rounded-lg transition-colors">+</button>
            </div>
            <VueDraggable v-model="grouped[col.statusKey]" group="kanban" tag="div"
              class="flex-1 p-3 space-y-2 min-h-24"
              @start="isDragging = true" @end="onDragEnd">
              <div v-for="item in grouped[col.statusKey]" :key="item.id">
                <UnitCardTryout :unit="item" @edit="editUnit(item.id)" @split="splitUnit(item.id)" />
              </div>
              <div v-if="!grouped[col.statusKey]?.length"
                class="text-sm font-medium text-gray-500 text-center py-8 pointer-events-none select-none">
                Drop units here
              </div>
            </VueDraggable>
          </div>
        </div>
      </VueDraggable>
    </template>

    <template v-else>
      <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[680px] text-sm text-gray-900 border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wider">
                <th class="text-left px-4 py-3 whitespace-nowrap">Status</th>
                <th class="text-left px-4 py-3 whitespace-nowrap cursor-pointer select-none hover:text-gray-900 transition-colors"
                  title="Sort by unit" tabindex="0" :aria-sort="sortKey === 'unit' ? (sortDir === 1 ? 'ascending' : 'descending') : 'none'"
                  @click="toggleSort('unit')" @keydown.enter.prevent="toggleSort('unit')" @keydown.space.prevent="toggleSort('unit')">
                  <span class="inline-flex items-center gap-1">
                    Unit
                    <span v-if="sortKey === 'unit'" class="text-[10px] leading-none">{{ sortDir === 1 ? '▲' : '▼' }}</span>
                  </span>
                </th>
                <th class="text-left px-4 py-3 whitespace-nowrap cursor-pointer select-none hover:text-gray-900 transition-colors"
                  title="Sort by location" tabindex="0" :aria-sort="sortKey === 'location' ? (sortDir === 1 ? 'ascending' : 'descending') : 'none'"
                  @click="toggleSort('location')" @keydown.enter.prevent="toggleSort('location')" @keydown.space.prevent="toggleSort('location')">
                  <span class="inline-flex items-center gap-1">
                    Location
                    <span v-if="sortKey === 'location'" class="text-[10px] leading-none">{{ sortDir === 1 ? '▲' : '▼' }}</span>
                  </span>
                </th>
                <th class="text-left px-4 py-3 whitespace-nowrap hidden md:table-cell">Type</th>
                <th class="text-left px-4 py-3 whitespace-nowrap hidden md:table-cell">Crew</th>
                <th class="text-left px-4 py-3 whitespace-nowrap hidden lg:table-cell">Leader</th>
                <th class="text-left px-4 py-3">Notes</th>
                <th class="text-left px-4 py-3 whitespace-nowrap cursor-pointer select-none hover:text-gray-900 transition-colors"
                  title="Sort by last update" tabindex="0" :aria-sort="sortKey === 'updated' ? (sortDir === 1 ? 'ascending' : 'descending') : 'none'"
                  @click="toggleSort('updated')" @keydown.enter.prevent="toggleSort('updated')" @keydown.space.prevent="toggleSort('updated')">
                  <span class="inline-flex items-center gap-1">
                    Updated
                    <span v-if="sortKey === 'updated'" class="text-[10px] leading-none">{{ sortDir === 1 ? '▲' : '▼' }}</span>
                  </span>
                </th>
                <th class="px-4 py-3 whitespace-nowrap"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in listUnits" :key="u.id" @click="editUnit(u.id)"
                class="border-b border-gray-200 last:border-b-0 hover:bg-blue-50 transition-colors cursor-pointer">
                <td class="px-4 py-3 whitespace-nowrap"
                  :style="{ borderLeftColor: `var(--status-${u.status})`, borderLeftWidth: '4px' }">
                  <span class="badge uppercase"
                    :class="statusLabels[u.status] ? `status-bg-${u.status} status-text-${u.status}` : 'bg-gray-700 text-white'">
                    {{ statusLabels[u.status] || u.status }}
                  </span>
                </td>
                <td class="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">{{ u.unit }}</td>
                <td class="px-4 py-3 font-semibold text-gray-900">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <svg class="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span class="truncate max-w-56">{{ u.location || '—' }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                  <span v-if="typeSummary(u)" class="font-bold uppercase tracking-wide">{{ typeSummary(u) }}</span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                  <span v-if="totalCrew(u)" class="font-bold tabular-nums">{{ totalCrew(u) }}</span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                  <template v-if="u.leader">
                    <span class="font-semibold text-gray-900">{{ u.leader }}</span>
                    <span v-if="u.leaderPhone" class="font-medium text-gray-700"> · {{ u.leaderPhone }}</span>
                  </template>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 text-gray-800 max-w-56">
                  <span v-if="u.notes" class="line-clamp-2" :title="u.notes">{{ u.notes }}</span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap font-semibold text-gray-900 font-mono tabular-nums">
                  {{ formatWhen(u) }}
                </td>
                <td class="px-4 py-3 text-right whitespace-nowrap">
                  <button v-if="normalizeVehicles(u).length > 1" @click.stop="splitUnit(u.id)" title="Split unit"
                    class="text-sm font-semibold text-gray-700 hover:text-gray-900 px-2.5 py-1 rounded-md hover:bg-gray-100 transition-colors">
                    Split
                  </button>
                  <button @click.stop="editUnit(u.id)" title="Edit unit"
                    class="text-sm font-semibold text-blue-700 hover:text-blue-800 px-2.5 py-1 rounded-md hover:bg-blue-100 transition-colors">
                    Edit
                  </button>
                </td>
              </tr>
              <tr v-if="!listUnits.length">
                <td colspan="9" class="px-4 py-12 text-center text-gray-600 text-sm">
                  No units match the current search or filter.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="text-sm font-semibold text-gray-600 mt-2">
        {{ listUnits.length }} {{ listUnits.length === 1 ? 'unit' : 'units' }} shown
      </div>
    </template>

    <UnitFormTryout v-if="showForm" :presetStatus="formStatus"
      :editId="editingId" @close="closeForm" />
    <SplitUnit v-if="showSplit && splitId" :unitId="splitId" @close="closeSplit" />
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useYjs, updateKanbanColumn } from '../composables/useYjs.js'
import { typeSummary, totalCrew, vehicleSearchText, normalizeVehicles } from '../composables/vehicles.js'
import UnitCardTryout from '../components/UnitCardTryout.vue'
import UnitFormTryout from '../components/UnitFormTryout.vue'
import SplitUnit from '../components/SplitUnit.vue'

const { units, radioChannels, kanbanColumns, syncKanbanState } = useYjs()

const showForm = ref(false)
const formStatus = ref('')
const showSplit = ref(false)
const splitId = ref('')
const editingId = ref('')
const search = ref('')
const filterStatus = ref('')
const isDragging = ref(false)

/* -------------------------------
   View mode (board / list)
------------------------------ */
const view = ref('board')
const viewModes = [
  { value: 'board', label: 'Board' },
  { value: 'list', label: 'List' },
]
const VIEW_KEY = 'kanban-tryout-view'
try {
  const saved = localStorage.getItem(VIEW_KEY)
  if (saved === 'board' || saved === 'list') view.value = saved
} catch {
  /* storage unavailable */
}
function setView(mode) {
  view.value = mode
  try {
    localStorage.setItem(VIEW_KEY, mode)
  } catch {
    /* storage unavailable */
  }
}

const statuses = [
  { key: 'en-route', label: 'V PRIHODU' },
  { key: 'on-scene', label: 'NERAZPOREJENI' },
  { key: 'triaged', label: 'V POSREDOVANJU' },
  { key: 'transport', label: 'ODHOD' },
  { key: 'cleared', label: 'DRUGO' },
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

const statusLabels = Object.fromEntries(statuses.map(s => [s.key, s.label]))

// Build a searchable string from every field shown on the unit card.
function unitSearchText(u) {
  return [
    u.unit,
    u.location,
    u.notes,
    u.leader,
    u.leaderPhone,
    u.type,
    u.personnelCount,
    vehicleSearchText(u),
    totalCrew(u),
    statusLabels[u.status] || u.status,
  ]
    .filter(v => v !== null && v !== undefined && v !== '')
    .join(' ')
    .toLowerCase()
}

const filtered = computed(() => {
  const terms = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (!terms.length) return units.value
  return units.value.filter(u => {
    const haystack = unitSearchText(u)
    return terms.every(term => haystack.includes(term))
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

/* -------------------------------
   List view: sorting + formatting
------------------------------ */
const sortKey = ref('')
const sortDir = ref(1)

// Click a sortable header: asc -> desc -> back to status grouping.
function toggleSort(key) {
  if (sortKey.value !== key) {
    sortKey.value = key
    sortDir.value = 1
  } else if (sortDir.value === 1) {
    sortDir.value = -1
  } else {
    sortKey.value = ''
    sortDir.value = 1
  }
}

const statusRank = computed(() => {
  const map = new Map()
  columnList.value.forEach((c, i) => map.set(c.statusKey, i))
  return map
})

function unitRank(u) {
  return u.order ?? -(u.updatedAt || u.createdAt || 0)
}

const listUnits = computed(() => {
  const rows = filtered.value.filter(u => !filterStatus.value || u.status === filterStatus.value)
  return [...rows].sort((a, b) => {
    if (!sortKey.value) {
      const ar = statusRank.value.has(a.status) ? statusRank.value.get(a.status) : Number.MAX_SAFE_INTEGER
      const br = statusRank.value.has(b.status) ? statusRank.value.get(b.status) : Number.MAX_SAFE_INTEGER
      if (ar !== br) return ar - br
      return unitRank(a) - unitRank(b)
    }
    let cmp
    if (sortKey.value === 'updated') {
      cmp = (a.updatedAt || a.createdAt || 0) - (b.updatedAt || b.createdAt || 0)
    } else {
      cmp = String(a[sortKey.value] || '').localeCompare(String(b[sortKey.value] || ''), undefined, {
        sensitivity: 'base',
        numeric: true,
      })
    }
    return cmp * sortDir.value
  })
})

function formatWhen(u) {
  const d = new Date(u.updatedAt || u.createdAt)
  if (Number.isNaN(d.getTime())) return '—'
  const now = new Date()
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === now.toDateString()) return time
  return `${d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })} ${time}`
}

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

function splitUnit(id) {
  splitId.value = id
  showSplit.value = true
}

function closeSplit() {
  showSplit.value = false
  splitId.value = ''
}
</script>
