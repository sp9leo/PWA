<template>
  <div>
    <div class="flex items-center justify-between gap-3 mb-6">
      <h1 class="text-2xl font-bold">Admin</h1>
    </div>

    <!-- Config cards in a compact responsive grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <!-- Sectors / Locations -->
      <div class="card mb-0">
        <h2 class="text-base font-bold text-gray-900 mb-3">Sectors / Locations</h2>
        <div class="flex flex-wrap items-end gap-2 mb-3">
          <div class="flex-1 min-w-28">
            <label class="label mb-1 block">Name</label>
            <input v-model="sectorForm.name" class="input-sm" placeholder="e.g. North Zone"
              @keydown.enter="saveSector" />
          </div>
          <div class="flex-[2] min-w-40">
            <label class="label mb-1 block">Description</label>
            <input v-model="sectorForm.description" class="input-sm" placeholder="Optional description"
              @keydown.enter="saveSector" />
          </div>
          <button @click="saveSector" class="btn-primary btn-sm mt-3">Add</button>
        </div>
        <div class="space-y-1">
          <div v-for="s in sectors" :key="s.id"
            class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
            <template v-if="editingSectorId === s.id">
              <div class="flex items-center gap-2 flex-1 flex-wrap">
                <input v-model="editSectorForm.name" class="input-sm flex-1 min-w-28" placeholder="Name" />
                <input v-model="editSectorForm.description" class="input-sm flex-[2] min-w-40" placeholder="Description" />
              </div>
              <div class="flex items-center gap-2 shrink-0 ml-2">
                <button @click="saveSectorEdit" class="text-green-700 hover:text-green-800 text-sm font-semibold">Save</button>
                <button @click="cancelSectorEdit" class="text-gray-700 hover:text-gray-900 text-sm font-semibold">Cancel</button>
              </div>
            </template>
            <template v-else>
              <div class="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                <span class="text-sm font-semibold text-gray-900">{{ s.name }}</span>
                <span v-if="s.description" class="text-sm text-gray-600 truncate">{{ s.description }}</span>
              </div>
              <div class="flex items-center gap-2 shrink-0 ml-2">
                <button @click="startSectorEdit(s)" class="text-gray-700 hover:text-gray-900 text-sm font-semibold">Edit</button>
                <button @click="removeSector(s.id)" class="text-red-600 hover:text-red-700 text-sm font-semibold">Delete</button>
              </div>
            </template>
          </div>
          <div v-if="!sectors.length" class="text-sm text-gray-600 text-center py-4">No sectors yet</div>
        </div>
      </div>

      <!-- Radio Channels (next to Sectors) -->
      <div class="card mb-0">
        <h2 class="text-base font-bold text-gray-900 mb-3">Radio Channels</h2>
        <div class="flex flex-wrap items-end gap-2 mb-3">
          <div class="flex-1 min-w-28">
            <label class="label mb-1 block">Channel</label>
            <input v-model="channelForm.name" class="input-sm" placeholder="e.g. CH-1"
              @keydown.enter="saveChannel" />
          </div>
          <div class="flex-1 min-w-24">
            <label class="label mb-1 block">Frequency</label>
            <input v-model="channelForm.frequency" class="input-sm" placeholder="e.g. 155.400"
              @keydown.enter="saveChannel" />
          </div>
          <div class="flex-[2] min-w-40">
            <label class="label mb-1 block">Description</label>
            <input v-model="channelForm.description" class="input-sm" placeholder="Optional description"
              @keydown.enter="saveChannel" />
          </div>
          <button @click="saveChannel" class="btn-primary btn-sm mt-3">Add</button>
        </div>
        <div class="space-y-1">
          <div v-for="c in radioChannels" :key="c.id"
            class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
            <template v-if="editingChannelId === c.id">
              <div class="flex items-center gap-2 flex-1 flex-wrap">
                <input v-model="editChannelForm.name" class="input-sm flex-1 min-w-20" placeholder="Channel" />
                <input v-model="editChannelForm.frequency" class="input-sm flex-1 min-w-20" placeholder="Frequency" />
                <input v-model="editChannelForm.description" class="input-sm flex-[2] min-w-36" placeholder="Description" />
              </div>
              <div class="flex items-center gap-2 shrink-0 ml-2">
                <button @click="saveChannelEdit" class="text-green-700 hover:text-green-800 text-sm font-semibold">Save</button>
                <button @click="cancelChannelEdit" class="text-gray-700 hover:text-gray-900 text-sm font-semibold">Cancel</button>
              </div>
            </template>
            <template v-else>
              <div class="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                <span class="text-sm font-semibold text-gray-900">{{ c.name }}</span>
                <span v-if="c.frequency" class="text-sm text-gray-600 font-mono">{{ c.frequency }}</span>
                <span v-if="c.description" class="text-sm text-gray-600 truncate">{{ c.description }}</span>
              </div>
              <div class="flex items-center gap-2 shrink-0 ml-2">
                <button @click="startChannelEdit(c)" class="text-gray-700 hover:text-gray-900 text-sm font-semibold">Edit</button>
                <button @click="removeRadioChannel(c.id)" class="text-red-600 hover:text-red-700 text-sm font-semibold">Delete</button>
              </div>
            </template>
          </div>
          <div v-if="!radioChannels.length" class="text-sm text-gray-600 text-center py-4">No radio channels yet</div>
        </div>
      </div>

      <!-- Predefined Units -->
      <div class="card mb-0">
        <div class="flex items-center justify-between gap-3 mb-3">
          <h2 class="text-base font-bold text-gray-900">Predefined Units</h2>
          <button @click="showUnitForm = true" class="btn-primary btn-sm">
            <span class="text-base leading-none">+</span> Add Unit
          </button>
        </div>
        <div class="space-y-1">
          <div v-for="u in predefinedUnits" :key="u.id"
            class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
            <template v-if="editingUnitId === u.id">
              <div class="flex items-center gap-2 flex-1 flex-wrap">
                <input v-model="editUnitForm.name" class="input-sm flex-1 min-w-20" placeholder="Name" />
                <select v-model="editUnitForm.type" class="input-sm flex-1 min-w-16">
                  <option value="">—</option>
                  <option v-for="t in unitTypes" :key="t.id" :value="t.name">{{ t.name }}</option>
                </select>
                <select v-model="editUnitForm.defaultStatus" class="input-sm">
                  <option v-for="s in statuses" :key="s.key" :value="s.key">{{ s.label }}</option>
                </select>
                <input v-model="editUnitForm.department" class="input-sm flex-1 min-w-22" placeholder="Department" />
                <input v-model="editUnitForm.pin" class="input-sm w-16" placeholder="PIN" maxlength="4" pattern="[0-9]*" />
              </div>
              <div class="flex items-center gap-2 shrink-0 ml-2">
                <button @click="saveUnitEdit" class="text-green-700 hover:text-green-800 text-sm font-semibold">Save</button>
                <button @click="cancelUnitEdit" class="text-gray-700 hover:text-gray-900 text-sm font-semibold">Cancel</button>
              </div>
            </template>
            <template v-else>
              <div class="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                <span class="text-sm font-semibold text-gray-900">{{ u.name }}</span>
                <span v-if="u.type" class="text-sm text-gray-600">{{ u.type }}</span>
                <span v-if="u.department" class="text-sm text-gray-600">{{ u.department }}</span>
                <span v-if="u.pin" class="text-sm font-mono text-gray-700">PIN:{{ u.pin }}</span>
                <span class="badge" :class="`status-bg-${u.defaultStatus} status-text-${u.defaultStatus}`">
                  {{ statusLabel(u.defaultStatus) }}
                </span>
              </div>
              <div class="flex items-center gap-2 shrink-0 ml-2">
                <button @click="startUnitEdit(u)" class="text-gray-700 hover:text-gray-900 text-sm font-semibold">Edit</button>
                <button @click="removePredefinedUnit(u.id)" class="text-red-600 hover:text-red-700 text-sm font-semibold">Delete</button>
              </div>
            </template>
          </div>
          <div v-if="!predefinedUnits.length" class="text-sm text-gray-600 text-center py-4">No predefined units yet</div>
        </div>
      </div>

      <!-- Unit Types -->
      <div class="card mb-0">
        <h2 class="text-base font-bold text-gray-900 mb-3">Unit Types</h2>
        <div class="flex flex-wrap items-end gap-2 mb-3">
          <div class="flex-1 min-w-28">
            <label class="label mb-1 block">Name</label>
            <input v-model="typeForm.name" class="input-sm" placeholder="e.g. GVGP-1"
              @keydown.enter="saveType" />
          </div>
          <button @click="saveType" class="btn-primary btn-sm mt-3">Add</button>
        </div>
        <div class="space-y-1">
          <div v-for="t in unitTypes" :key="t.id"
            class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
            <template v-if="editingTypeId === t.id">
              <input v-model="editTypeForm.name" class="input-sm flex-1" placeholder="Name" />
              <div class="flex items-center gap-2 shrink-0 ml-2">
                <button @click="saveTypeEdit" class="text-green-700 hover:text-green-800 text-sm font-semibold">Save</button>
                <button @click="cancelTypeEdit" class="text-gray-700 hover:text-gray-900 text-sm font-semibold">Cancel</button>
              </div>
            </template>
            <template v-else>
              <span class="text-sm font-mono font-bold text-gray-900">{{ t.name }}</span>
              <div class="flex items-center gap-2 shrink-0 ml-2">
                <button @click="startTypeEdit(t)" class="text-gray-700 hover:text-gray-900 text-sm font-semibold">Edit</button>
                <button @click="removeUnitType(t.id)" class="text-red-600 hover:text-red-700 text-sm font-semibold">Delete</button>
              </div>
            </template>
          </div>
          <div v-if="!unitTypes.length" class="text-sm text-gray-600 text-center py-4">No unit types yet</div>
        </div>
      </div>

      <!-- Kanban Columns -->
      <div class="card mb-0">
        <h2 class="text-base font-bold text-gray-900 mb-3">Kanban Columns</h2>
        <div class="flex flex-wrap items-end gap-2 mb-3">
          <div class="flex-1 min-w-40">
            <label class="label mb-1 block">Status</label>
            <select v-model="columnForm.statusKey" class="input-sm">
              <option v-for="s in statuses" :key="s.key" :value="s.key">{{ s.label }}</option>
            </select>
          </div>
          <button @click="saveColumn" class="btn-primary btn-sm mt-3">Add</button>
        </div>
        <div class="space-y-1">
          <div v-for="col in sortedColumns" :key="col.id"
            class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
            <template v-if="editingColumnId === col.id">
              <div class="flex items-center gap-2 flex-1 flex-wrap">
                <select v-model="editColumnForm.statusKey" class="input-sm flex-1 min-w-32">
                  <option v-for="s in statuses" :key="s.key" :value="s.key">{{ s.label }}</option>
                </select>
              </div>
              <div class="flex items-center gap-2 shrink-0 ml-2">
                <button @click="saveColumnEdit" class="text-green-700 hover:text-green-800 text-sm font-semibold">Save</button>
                <button @click="cancelColumnEdit" class="text-gray-700 hover:text-gray-900 text-sm font-semibold">Cancel</button>
              </div>
            </template>
            <template v-else>
              <div class="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                <span class="badge" :class="`status-bg-${col.statusKey} status-text-${col.statusKey}`">
                  {{ statusLabel(col.statusKey) }}
                </span>
              </div>
              <div class="flex items-center gap-2 shrink-0 ml-2">
                <button @click="startColumnEdit(col)" class="text-gray-700 hover:text-gray-900 text-sm font-semibold">Edit</button>
                <button @click="removeKanbanColumn(col.id)" class="text-red-600 hover:text-red-700 text-sm font-semibold">Delete</button>
              </div>
            </template>
          </div>
          <div v-if="!kanbanColumns.length" class="text-sm text-gray-600 text-center py-4">No columns yet</div>
        </div>
      </div>

      <!-- Security -->
      <div class="card mb-0">
        <h2 class="text-base font-bold text-gray-900 mb-3">Security</h2>
        <div class="flex flex-wrap items-end gap-2 mb-3">
          <div class="flex-1 min-w-28">
            <label class="label mb-1 block">Arriving View PIN</label>
            <input v-model="pinForm.code" class="input-sm" placeholder="4-digit PIN" maxlength="4" pattern="[0-9]*"
              @keydown.enter="savePin" />
          </div>
          <button @click="savePin" class="btn-primary btn-sm mt-3">{{ pinCode ? 'Change' : 'Set' }}</button>
          <button v-if="pinCode" @click="clearPin" class="btn-ghost btn-sm mt-3">Remove</button>
        </div>
        <p class="text-sm text-gray-600">{{ pinCode ? 'PIN is currently set.' : 'No PIN set — arriving view is unprotected.' }}</p>
      </div>
    </div>

    <!-- Active Units: full width below -->
    <div class="card mb-4">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 class="text-base font-bold text-gray-900">Active Units</h2>
      </div>

      <div class="flex flex-wrap items-center gap-2 mb-3">
        <div class="relative w-44">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">&#128269;</span>
          <input v-model="unitSearch" class="input-sm !pl-8" placeholder="Search units..." />
        </div>
        <span v-for="s in adminStatuses" :key="s.key"
          class="chip"
          :class="unitFilterStatus === s.key ? 'chip-active' : 'chip-inactive'"
          @click="unitFilterStatus = unitFilterStatus === s.key ? '' : s.key">
          <span class="w-1.5 h-1.5 rounded-full mr-1.5" :style="{ backgroundColor: `var(--status-${s.key})` }"></span>
          {{ s.label }}
        </span>
      </div>

      <div class="flex items-center gap-2 mb-3 min-h-8">
        <button v-if="selectedUnitIds.length >= 2" @click="showMerge = true"
          class="btn-sm text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors px-3 text-sm font-semibold">
          Merge {{ selectedUnitIds.length }} selected
        </button>
        <button v-if="selectedUnitIds.length" @click="deleteSelected"
          class="btn-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors px-3 text-sm">
          Delete {{ selectedUnitIds.length }} selected
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm text-gray-900">
          <thead>
            <tr class="border-b border-gray-200 text-gray-600 text-xs font-semibold uppercase tracking-wider">
              <th class="px-2 py-3 w-8">
                <input type="checkbox" :checked="allSelected" @change="toggleAll"
                  class="accent-blue-500 cursor-pointer" />
              </th>
              <th class="text-left px-2 py-3 font-semibold cursor-pointer select-none hover:text-gray-900 transition-colors" @click="unitToggleSort('unit')">
                Unit <span v-if="unitSortBy === 'unit'" class="ml-1">{{ unitSortDir === 'asc' ? '&#9650;' : '&#9660;' }}</span>
              </th>
              <th class="text-left px-2 py-3 font-semibold hidden sm:table-cell">Type</th>
              <th class="text-left px-2 py-3 font-semibold hidden sm:table-cell cursor-pointer select-none hover:text-gray-900 transition-colors" @click="unitToggleSort('location')">
                Location <span v-if="unitSortBy === 'location'" class="ml-1">{{ unitSortDir === 'asc' ? '&#9650;' : '&#9660;' }}</span>
              </th>
              <th class="text-left px-2 py-3 font-semibold cursor-pointer select-none hover:text-gray-900 transition-colors" @click="unitToggleSort('status')">
                Status <span v-if="unitSortBy === 'status'" class="ml-1">{{ unitSortDir === 'asc' ? '&#9650;' : '&#9660;' }}</span>
              </th>
              <th class="text-left px-2 py-3 font-semibold hidden md:table-cell">Notes</th>
              <th class="text-left px-2 py-3 font-semibold hidden lg:table-cell">Leader</th>
              <th class="text-left px-2 py-3 font-semibold hidden lg:table-cell">Pers.</th>
              <th class="text-left px-2 py-3 font-semibold hidden lg:table-cell cursor-pointer select-none hover:text-gray-900 transition-colors" @click="unitToggleSort('updatedAt')">
                Updated <span v-if="unitSortBy === 'updatedAt'" class="ml-1">{{ unitSortDir === 'asc' ? '&#9650;' : '&#9660;' }}</span>
              </th>
              <th class="text-right px-2 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in unitSorted" :key="u.id"
              class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="px-2 py-3">
                <input type="checkbox" :checked="selectedUnitIds.includes(u.id)" @change="toggleUnit(u.id)"
                  class="accent-blue-500 cursor-pointer" />
              </td>
              <td class="px-2 py-3">
                <div class="font-semibold text-gray-900">{{ u.unit }}</div>
                <div class="text-sm text-gray-600 sm:hidden">{{ u.location }}</div>
              </td>
              <td class="px-2 py-3 text-gray-700 hidden sm:table-cell"><span class="font-semibold">{{ typeSummary(u) || '—' }}</span></td>
              <td class="px-2 py-3 text-gray-700 hidden sm:table-cell max-w-32 truncate">{{ u.location }}</td>
              <td class="px-2 py-3">
                <select :value="u.status" @change="unitMoveStatus(u.id, $event.target.value)"
                  class="bg-white border border-gray-300 rounded-lg px-2 py-1 text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500 cursor-pointer">
                  <option v-for="s in STATUSES" :key="s" :value="s">{{ unitStatusLabel(s) }}</option>
                </select>
              </td>
              <td class="px-2 py-3 text-gray-700 max-w-40 truncate hidden md:table-cell">{{ u.notes || '—' }}</td>
              <td class="px-2 py-3 text-gray-700 text-sm hidden lg:table-cell max-w-28 truncate">{{ u.leader || '—' }}<span v-if="u.leaderPhone">&middot; {{ u.leaderPhone }}</span></td>
              <td class="px-2 py-3 text-gray-700 text-sm hidden lg:table-cell">{{ totalCrew(u) || '—' }}</td>
              <td class="px-2 py-3 text-gray-700 text-sm hidden lg:table-cell whitespace-nowrap">{{ unitFormatTime(u.updatedAt || u.createdAt) }}</td>
              <td class="px-2 py-3 text-right whitespace-nowrap">
                <button @click="unitEdit(u.id)" class="btn-ghost btn-sm !px-2 text-gray-700 hover:text-gray-900" title="Edit">&#9998;</button>
                <button v-if="normalizeVehicles(u).length > 1" @click="unitSplit(u.id)" class="btn-ghost btn-sm !px-2 text-gray-700 hover:text-gray-900" title="Split">&#9986;</button>
                <button @click="unitDelete(u.id)" class="btn-ghost btn-sm !px-2 text-red-600 hover:text-red-700" title="Delete">&#10005;</button>
              </td>
            </tr>
            <tr v-if="!unitSorted.length">
              <td colspan="11" class="px-4 py-12 text-center text-gray-600 text-sm">
                {{ unitSearch || unitFilterStatus ? 'No matching units' : 'No units yet' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <UnitForm v-if="showUnitForm && !activeUnitEditId" @close="showUnitForm = false" />
    <UnitForm v-if="showUnitForm && activeUnitEditId" :editId="activeUnitEditId" @close="closeUnitForm" />
    <SplitUnit v-if="showSplit && splitUnitId" :unitId="splitUnitId" @close="closeSplit" />
    <MergeUnits v-if="showMerge" :unitIds="selectedUnitIds" @close="closeMerge" />

    <!-- Backup & Export -->
    <div class="card mt-6">
      <h2 class="text-base font-bold text-gray-900 mb-3">Backup &amp; Export</h2>
      <div class="flex items-center gap-2">
        <button @click="exportBackup" class="btn-primary btn-sm">
          <span class="text-lg leading-none">⬇</span> Export JSON
        </button>
        <label class="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
          Import JSON
          <input type="file" accept=".json" @change="importBackup" class="hidden" />
        </label>
      </div>
      <p class="text-xs text-gray-500 mt-2">
        Export includes all units, activities, sectors, radio channels, unit types, kanban columns, and settings.
        Import replaces all existing data.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useYjs, addPredefinedUnit, updatePredefinedUnit, removePredefinedUnit, addSector, updateSector, removeSector, addRadioChannel, updateRadioChannel, removeRadioChannel, addUnitType, updateUnitType, removeUnitType, addKanbanColumn, updateKanbanColumn, removeKanbanColumn, removeUnit, moveUnit, setPinCode, pinCode, exportData, importData } from '../composables/useYjs.js'
import { typeSummary, totalCrew, vehicleSearchText, normalizeVehicles } from '../composables/vehicles.js'
import { useToast } from '../composables/useToast.js'
import UnitForm from '../components/UnitForm.vue'
import SplitUnit from '../components/SplitUnit.vue'
import MergeUnits from '../components/MergeUnits.vue'

const { predefinedUnits, sectors, radioChannels, unitTypes, kanbanColumns, units, STATUSES } = useYjs()
const { add: addToast } = useToast()

const statuses = [
  { key: 'en-route', label: 'V PRIHODU' },
  { key: 'on-scene', label: 'NERAZPOREJENI' },
  { key: 'triaged', label: 'V POSREDOVANJU' },
  { key: 'transport', label: 'ODHOD' },
  { key: 'cleared', label: 'DRUGO' },
]

const statusLabel = (s) => statuses.find(st => st.key === s)?.label || s

const unitForm = ref({ name: '', type: '', defaultStatus: 'en-route', department: '', pin: '' })
function saveUnit() {
  if (!unitForm.value.name.trim()) { addToast('Unit name required', 'error'); return }
  addPredefinedUnit({ ...unitForm.value })
  addToast('Predefined unit added', 'success')
  unitForm.value = { name: '', type: '', defaultStatus: 'en-route', department: '', pin: '' }
}

const editingUnitId = ref('')
const editUnitForm = ref({ name: '', type: '', defaultStatus: 'en-route', department: '', pin: '' })
function startUnitEdit(u) {
  editingUnitId.value = u.id
  editUnitForm.value = { name: u.name, type: u.type || '', defaultStatus: u.defaultStatus, department: u.department || '', pin: u.pin || '' }
}
function saveUnitEdit() {
  if (!editUnitForm.value.name.trim()) { addToast('Name required', 'error'); return }
  updatePredefinedUnit(editingUnitId.value, { ...editUnitForm.value })
  addToast('Unit updated', 'success')
  editingUnitId.value = ''
}
function cancelUnitEdit() { editingUnitId.value = '' }

const sectorForm = ref({ name: '', description: '' })
function saveSector() {
  if (!sectorForm.value.name.trim()) { addToast('Sector name required', 'error'); return }
  addSector({ ...sectorForm.value })
  addToast('Sector added', 'success')
  sectorForm.value = { name: '', description: '' }
}

const editingSectorId = ref('')
const editSectorForm = ref({ name: '', description: '' })
function startSectorEdit(s) {
  editingSectorId.value = s.id
  editSectorForm.value = { name: s.name, description: s.description || '' }
}
function saveSectorEdit() {
  if (!editSectorForm.value.name.trim()) { addToast('Name required', 'error'); return }
  updateSector(editingSectorId.value, { ...editSectorForm.value })
  addToast('Sector updated', 'success')
  editingSectorId.value = ''
}
function cancelSectorEdit() { editingSectorId.value = '' }

const typeForm = ref({ name: '' })
function saveType() {
  if (!typeForm.value.name.trim()) { addToast('Type name required', 'error'); return }
  addUnitType({ ...typeForm.value })
  addToast('Unit type added', 'success')
  typeForm.value = { name: '' }
}

const editingTypeId = ref('')
const editTypeForm = ref({ name: '' })
function startTypeEdit(t) {
  editingTypeId.value = t.id
  editTypeForm.value = { name: t.name }
}
function saveTypeEdit() {
  if (!editTypeForm.value.name.trim()) { addToast('Name required', 'error'); return }
  updateUnitType(editingTypeId.value, { ...editTypeForm.value })
  addToast('Type updated', 'success')
  editingTypeId.value = ''
}
function cancelTypeEdit() { editingTypeId.value = '' }

const channelForm = ref({ name: '', frequency: '', description: '' })
function saveChannel() {
  if (!channelForm.value.name.trim()) { addToast('Channel name required', 'error'); return }
  addRadioChannel({ ...channelForm.value })
  addToast('Radio channel added', 'success')
  channelForm.value = { name: '', frequency: '', description: '' }
}

const editingChannelId = ref('')
const editChannelForm = ref({ name: '', frequency: '', description: '' })
function startChannelEdit(c) {
  editingChannelId.value = c.id
  editChannelForm.value = { name: c.name, frequency: c.frequency || '', description: c.description || '' }
}
function saveChannelEdit() {
  if (!editChannelForm.value.name.trim()) { addToast('Name required', 'error'); return }
  updateRadioChannel(editingChannelId.value, { ...editChannelForm.value })
  addToast('Channel updated', 'success')
  editingChannelId.value = ''
}
function cancelChannelEdit() { editingChannelId.value = '' }

const columnForm = ref({ statusKey: 'en-route' })
const sortedColumns = computed(() => [...kanbanColumns.value].sort((a, b) => a.order - b.order))

function columnExists(statusKey, excludeId = '') {
  return kanbanColumns.value.some(c => c.statusKey === statusKey && c.id !== excludeId)
}

function saveColumn() {
  const statusKey = columnForm.value.statusKey
  if (columnExists(statusKey)) {
    addToast(`A column for "${statusLabel(statusKey)}" already exists`, 'error')
    return
  }
  addKanbanColumn({ statusKey, label: statusLabel(statusKey) })
  addToast('Column added', 'success')
  columnForm.value = { statusKey: 'en-route' }
}

const editingColumnId = ref('')
const editColumnForm = ref({ statusKey: 'en-route' })
function startColumnEdit(col) {
  editingColumnId.value = col.id
  editColumnForm.value = { statusKey: col.statusKey }
}
function saveColumnEdit() {
  const statusKey = editColumnForm.value.statusKey
  if (columnExists(statusKey, editingColumnId.value)) {
    addToast(`A column for "${statusLabel(statusKey)}" already exists`, 'error')
    return
  }
  updateKanbanColumn(editingColumnId.value, { statusKey, label: statusLabel(statusKey) })
  addToast('Column updated', 'success')
  editingColumnId.value = ''
}
function cancelColumnEdit() { editingColumnId.value = '' }

const pinForm = ref({ code: '' })
function savePin() {
  const code = pinForm.value.code.trim()
  if (code && !/^\d{4}$/.test(code)) { addToast('PIN must be 4 digits', 'error'); return }
  setPinCode(code)
  addToast(code ? 'PIN set' : 'PIN removed', 'success')
  pinForm.value = { code: '' }
}
function clearPin() {
  setPinCode('')
  addToast('PIN removed', 'success')
}

/* ---------- Backup & Export ---------- */

function exportBackup() {
  const data = exportData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `incident-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  addToast('Backup exported', 'success')
}

function importBackup(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      importData(data)
      addToast('Backup imported – all data replaced', 'success')
      event.target.value = ''
    } catch (err) {
      addToast('Import failed: invalid file', 'error')
      console.error(err)
    }
  }
  reader.onerror = () => {
    addToast('Import failed: could not read file', 'error')
  }
  reader.readAsText(file)
}

/* ---------- Active Units ---------- */
const adminStatuses = [
  { key: 'en-route', label: 'V PRIHODU' },
  { key: 'on-scene', label: 'NERAZPOREJENI' },
  { key: 'triaged', label: 'V POSREDOVANJU' },
  { key: 'transport', label: 'ODHOD' },
  { key: 'cleared', label: 'DRUGO' },
]
const unitStatusLabel = (s) => adminStatuses.find(st => st.key === s)?.label || s

const showUnitForm = ref(false)
const showSplit = ref(false)
const splitUnitId = ref('')
const showMerge = ref(false)
const activeUnitEditId = ref('')
const unitSearch = ref('')
const unitFilterStatus = ref('')
const unitSortBy = ref('updatedAt')
const unitSortDir = ref('desc')
const selectedUnitIds = ref([])

function unitToggleSort(col) {
  if (unitSortBy.value === col) {
    unitSortDir.value = unitSortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    unitSortBy.value = col
    unitSortDir.value = 'asc'
  }
}

const unitFiltered = computed(() => {
  let list = [...units.value]
  const q = unitSearch.value.toLowerCase().trim()
  if (q) {
    list = list.filter(u => {
      const haystack = [
        u.unit,
        u.location,
        u.notes,
        u.leader,
        u.leaderPhone,
        typeSummary(u),
        vehicleSearchText(u),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }
  if (unitFilterStatus.value) {
    list = list.filter(u => u.status === unitFilterStatus.value)
  }
  list.sort((a, b) => {
    const aVal = a[unitSortBy.value] ?? ''
    const bVal = b[unitSortBy.value] ?? ''
    const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal
    return unitSortDir.value === 'asc' ? cmp : -cmp
  })
  return list
})

const unitSorted = computed(() => unitFiltered.value)

const allSelected = computed(() =>
  unitSorted.value.length > 0 && selectedUnitIds.value.length === unitSorted.value.length
)

function toggleUnit(id) {
  const idx = selectedUnitIds.value.indexOf(id)
  if (idx > -1) selectedUnitIds.value.splice(idx, 1)
  else selectedUnitIds.value.push(id)
}

function toggleAll() {
  if (allSelected.value) selectedUnitIds.value = []
  else selectedUnitIds.value = unitSorted.value.map(u => u.id)
}

function deleteSelected() {
  if (!selectedUnitIds.value.length) return
  selectedUnitIds.value.forEach(id => removeUnit(id))
  addToast(`Deleted ${selectedUnitIds.value.length} unit(s)`, 'success')
  selectedUnitIds.value = []
}

function unitMoveStatus(id, status) {
  moveUnit(id, status)
  addToast(`Status updated to ${unitStatusLabel(status)}`, 'info')
}

function unitDelete(id) {
  removeUnit(id)
  addToast('Unit deleted', 'success')
  selectedUnitIds.value = selectedUnitIds.value.filter(i => i !== id)
}

function unitEdit(id) {
  activeUnitEditId.value = id
  showUnitForm.value = true
}

function closeUnitForm() {
  showUnitForm.value = false
  activeUnitEditId.value = ''
}

function unitSplit(id) {
  splitUnitId.value = id
  showSplit.value = true
}

function closeSplit() {
  showSplit.value = false
  splitUnitId.value = ''
}

function closeMerge() {
  showMerge.value = false
  selectedUnitIds.value = []
}

function unitFormatTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  if (sameDay) return time
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + time
}
</script>
