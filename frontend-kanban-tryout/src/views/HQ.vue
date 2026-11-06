<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="border-b border-gray-200 bg-white sticky top-0 z-20">
      <div class="flex items-center justify-between gap-3 px-4 py-3">
        <div class="flex items-center gap-2">
          <img
            src="/fire-truck.svg"
            alt=""
            class="w-8 h-8 object-contain"
          />
          <div>
            <div class="text-lg font-bold text-gray-900">HQ — Read Only</div>
            <div class="text-xs text-gray-500">Incident overview · synced live</div>
          </div>
        </div>

        <div class="flex items-center gap-3 ml-auto">
          <div class="flex items-center gap-1 text-sm">
            <span
              class="w-2 h-2 rounded-full"
              :class="connected ? 'bg-green-500' : 'bg-gray-400'"
            ></span>
            <span :class="connected ? 'text-green-700 font-semibold' : 'text-gray-500'">
              {{ connected ? 'Online' : 'Offline' }}
            </span>
          </div>
          <div class="text-xs text-gray-400">{{ updatedAt }}</div>
          <button
            @click="toggleView"
            class="btn-ghost text-sm font-semibold text-gray-600 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            {{ view === 'board' ? 'List view' : 'Board view' }}
          </button>
        </div>
      </div>
    </header>

    <main class="p-4 lg:p-6">
      <!-- Search + status filter bar (same as board) -->
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <div class="relative w-64">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">🔍</span>
          <input
            v-model="search"
            class="input-sm !pl-8 !pr-8"
            placeholder="Search all card fields…"
          />
          <button
            v-if="search"
            @click="search = ''"
            title="Clear search"
            class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 leading-none"
          >
            &times;
          </button>
        </div>
        <span
          v-for="s in statuses"
          :key="s.key"
          class="chip cursor-pointer select-none"
          :class="filterStatus === s.key ? 'chip-active' : 'chip-inactive'"
          @click="filterStatus = filterStatus === s.key ? '' : s.key"
        >
          <span
            class="w-2 h-2 rounded-full mr-1.5"
            :style="{ backgroundColor: `var(--status-${s.key})` }"
          />
          {{ s.label }}
        </span>
        <span class="ml-2 text-sm font-semibold text-gray-600">
          {{ filteredCount }} {{ filteredCount === 1 ? 'unit' : 'units' }} shown
        </span>
      </div>

      <!-- Board -->
      <section v-if="view === 'board'" class="space-y-2">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-lg font-bold text-gray-900">Units by status</h2>
          <div class="text-sm text-gray-600">{{ filteredCount }} unit{{ filteredCount !== 1 ? 's' : '' }}</div>
        </div>

        <div
          class="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none"
          style="-webkit-overflow-scrolling: touch"
        >
          <div
            v-for="col in visibleColumns"
            :key="col.id"
            class="flex-shrink-0 w-72 md:w-80 snap-start"
          >
            <div class="bg-gray-100 border border-gray-200 rounded-xl flex flex-col">
              <div class="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-300 bg-white rounded-t-xl">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="w-3 h-3 rounded-full shrink-0"
                    :style="{ backgroundColor: `var(--status-${col.statusKey})` }"></span>
                  <span class="text-base font-bold text-gray-900 truncate">
                    {{ col.label }}
                  </span>
                  <span class="text-sm font-bold text-gray-900 bg-gray-200 px-2 py-0.5 rounded-md tabular-nums shrink-0">
                    {{ colUnits(col.statusKey).length }}
                  </span>
                </div>
              </div>
              <div class="flex-1 p-3 space-y-3 min-h-[60px]">
                <div
                  v-for="unit in colUnits(col.statusKey)"
                  :key="unit.id"
                  class="hq-card cursor-default"
                  :style="{ borderLeftColor: `var(--status-${unit.status})`, borderLeftWidth: '0' }"
                >
                  <!-- Unit name: prominent, top -->
                  <div class="font-bold text-base text-gray-900 leading-tight line-clamp-2 mb-1">
                    {{ unit.unit }}
                  </div>

                  <div class="mt-1 flex items-center justify-between gap-2">
                    <div class="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                      <svg class="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span class="truncate max-w-[200px]">{{ unit.location || '—' }}</span>
                    </div>

                    <!-- Status badge: smaller, bottom right (column title already shows status) -->
                    <span
                      class="badge uppercase shrink-0"
                      :class="`status-bg-${unit.status} status-text-${unit.status}`"
                      style="font-size: 0.7rem; padding: 0.15rem 0.5rem;"
                    >
                      {{ statusLabel(unit.status) }}
                    </span>
                  </div>

                  <!-- Vehicle types & crew -->
                  <div v-if="vehicleGroups(unit).length || totalCrew(unit)" class="mt-1 flex flex-wrap items-center gap-2">
                    <div
                      v-for="g in vehicleGroups(unit)"
                      :key="g.type"
                      class="font-bold text-sm bg-white px-2 py-0.5 rounded-lg border border-gray-300 text-gray-900 flex items-center gap-1"
                    >
                      <img
                        src="/fire-truck.svg"
                        alt=""
                        class="w-6 h-5 object-contain select-none"
                      />
                      <span class="uppercase tracking-wide">
                        {{ g.count > 1 ? `${g.count}× ` : '' }}{{ g.type }}
                      </span>
                    </div>
                    <div v-if="totalCrew(unit)" class="font-bold text-sm bg-white px-2 py-0.5 rounded-lg border border-gray-300 text-gray-900 flex items-center gap-1">
                      <img
                        src="/firefighter-3.svg"
                        alt=""
                        class="w-6 h-5 object-contain select-none"
                      />
                      <span>{{ totalCrew(unit) }}</span>
                    </div>
                  </div>

                  <div class="mt-1 text-sm text-gray-600 truncate">
                    {{ unit.leader }}{{ unit.leaderPhone ? ' · ' + unit.leaderPhone : '' }}
                  </div>
                </div>
                <div v-if="colUnits(col.statusKey).length === 0"
                  class="text-sm font-medium text-gray-500 text-center py-8 pointer-events-none select-none">
                  Drop units here
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- List -->
      <section v-else class="space-y-2">
        <div class="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
          <table class="w-full min-w-[680px] text-sm text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wider">
                <th class="text-left px-4 py-3 whitespace-nowrap">Status</th>
                <th class="text-left px-4 py-3 whitespace-nowrap cursor-pointer select-none hover:text-gray-900 transition-colors"
                  tabindex="0" :aria-sort="sortKey === 'unit' ? (sortDir === 1 ? 'ascending' : 'descending') : 'none'"
                  @click="toggleSort('unit')" @keydown.enter="toggleSort('unit')" @keydown.space="toggleSort('unit')">
                  <span class="inline-flex items-center gap-1">
                    Unit
                    <span v-if="sortKey === 'unit'" class="text-[10px] leading-none">{{ sortDir === 1 ? '▲' : '▼' }}</span>
                  </span>
                </th>
                <th class="text-left px-4 py-3 whitespace-nowrap cursor-pointer select-none hover:text-gray-900 transition-colors"
                  tabindex="0" :aria-sort="sortKey === 'location' ? (sortDir === 1 ? 'ascending' : 'descending') : 'none'"
                  @click="toggleSort('location')" @keydown.enter="toggleSort('location')" @keydown.space="toggleSort('location')">
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
                  tabindex="0" :aria-sort="sortKey === 'updated' ? (sortDir === 1 ? 'ascending' : 'descending') : 'none'"
                  @click="toggleSort('updated')" @keydown.enter="toggleSort('updated')" @keydown.space="toggleSort('updated')">
                  <span class="inline-flex items-center gap-1">
                    Updated
                    <span v-if="sortKey === 'updated'" class="text-[10px] leading-none">{{ sortDir === 1 ? '▲' : '▼' }}</span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              <tr v-for="unit in sortedList" :key="unit.id" class="hover:bg-blue-50 transition-colors cursor-default">
                <td class="px-4 py-3 whitespace-nowrap"
                  :style="{ borderLeftColor: `var(--status-${unit.status})`, borderLeftWidth: '4px' }">
                  <span
                    class="badge uppercase"
                    :class="`status-bg-${unit.status} status-text-${unit.status}`"
                  >
                    {{ statusLabel(unit.status) }}
                  </span>
                </td>
                <td class="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">{{ unit.unit }}</td>
                <td class="px-4 py-3 font-semibold text-gray-900">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <svg class="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span class="truncate max-w-56">{{ unit.location || '—' }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                  <span v-if="vehicleSummary(unit)" class="font-bold uppercase tracking-wide">{{ vehicleSummary(unit) }}</span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                  <span v-if="totalCrew(unit)" class="font-bold tabular-nums">{{ totalCrew(unit) }}</span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                  <template v-if="unit.leader">
                    <span class="font-semibold text-gray-900">{{ unit.leader }}</span>
                    <span v-if="unit.leaderPhone" class="font-medium text-gray-700"> · {{ unit.leaderPhone }}</span>
                  </template>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 text-gray-800 max-w-56">
                  <span v-if="unit.notes" class="line-clamp-2" :title="unit.notes">{{ unit.notes }}</span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap font-semibold text-gray-900 font-mono tabular-nums">
                  {{ formatWhen(unit) }}
                </td>
              </tr>
              <tr v-if="sortedList.length === 0">
                <td colspan="8" class="px-4 py-12 text-center text-gray-600 text-sm">
                  No units match the current search or filter.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="text-sm font-semibold text-gray-600 mt-2">
          {{ sortedList.length }} {{ sortedList.length === 1 ? 'unit' : 'units' }} shown
        </div>
      </section>

      <!-- Empty state for whole app -->
      <div v-if="unitCount === 0" class="text-center py-20">
        <p class="text-gray-500 text-sm">No units reported yet.</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useYjs } from '../composables/useYjs.js'
import { vehicleTypeGroups, totalCrew, typeSummary, vehicleSearchText } from '../composables/vehicles.js'

const { units, connected, kanbanColumns } = useYjs()

const view = ref('board')
const VIEW_KEY = 'hq-tryout-view'
try {
  const saved = localStorage.getItem(VIEW_KEY)
  if (saved === 'board' || saved === 'list') view.value = saved
} catch {
  /* storage unavailable */
}
function toggleView() {
  view.value = view.value === 'board' ? 'list' : 'board'
  try {
    localStorage.setItem(VIEW_KEY, view.value)
  } catch {
    /* storage unavailable */
  }
}

const search = ref('')
const filterStatus = ref('')
const sortKey = ref('')
const sortDir = ref(1)

const statuses = [
  { key: 'en-route', label: 'V PRIHODU' },
  { key: 'on-scene', label: 'NERAZPOREJENI' },
  { key: 'triaged', label: 'V POSREDOVANJU' },
  { key: 'transport', label: 'ODHOD' },
  { key: 'cleared', label: 'DRUGO' },
]

const statusLabels = Object.fromEntries(statuses.map(s => [s.key, s.label]))

const statusLabel = (s) => statusLabels[s] || s

/* ---------- Kanban columns (always in sync with Admin) ---------- */
const columnList = computed(() => {
  const cols = kanbanColumns.value || []
  return [...cols].sort((a, b) => (a.order || 0) - (b.order || 0))
})

const visibleColumns = computed(() =>
  filterStatus.value
    ? columnList.value.filter(c => c.statusKey === filterStatus.value)
    : columnList.value
)

/* ---------- Search ---------- */
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
    statusLabel(u.status),
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

const filteredCount = computed(() => filtered.value.length)

/* ---------- Grouped (board) ---------- */
const grouped = reactive({})

function rebuildGrouped(list) {
  const keys = [...new Set(columnList.value.map(c => c.statusKey))]
  for (const k of keys) {
    grouped[k] = list.filter(u => u.status === k)
  }
}

watch(filtered, (val) => {
  rebuildGrouped(val)
}, { immediate: true })

function colUnits(colId) {
  return (grouped[colId] || [])
}

/* ---------- List sorting ---------- */
const statusRank = computed(() => {
  const map = new Map()
  columnList.value.forEach((c, i) => map.set(c.statusKey, i))
  return map
})

function unitRank(u) {
  return u.order ?? -(u.updatedAt || u.createdAt || 0)
}

const sortedList = computed(() => {
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

const unitCount = computed(() => units.value.length)

const updatedAt = computed(() => {
  if (!units.value.length) return '—'
  const latest = Math.max(...units.value.map(u => new Date(u.updatedAt || u.createdAt).getTime()))
  return formatTime(latest)
})

function formatWhen(u) {
  const d = new Date(u.updatedAt || u.createdAt)
  if (Number.isNaN(d.getTime())) return '—'
  const now = new Date()
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === now.toDateString()) return time
  return `${d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })} ${time}`
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

function vehicleGroups(unit) {
  return vehicleTypeGroups(unit)
}

function vehicleSummary(unit) {
  return typeSummary(unit)
}
</script>

<style scoped>
.hq-card {
  @apply bg-white border border-gray-200 rounded-xl p-4 shadow-sm;
}
</style>
