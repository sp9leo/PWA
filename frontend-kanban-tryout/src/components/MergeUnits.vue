<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center" @click.self="$emit('close')">
      <div class="absolute inset-0 bg-gray-900/30 backdrop-blur-sm"></div>
      <div class="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-slide-up">
        <div class="flex items-start justify-between gap-3 mb-4">
          <div class="min-w-0">
            <h2 class="text-lg font-bold">Merge Units</h2>
            <p class="text-sm font-semibold text-gray-600">
              {{ selectedUnits.length }} units into one
            </p>
          </div>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-900 text-xl leading-none">&times;</button>
        </div>

        <div v-if="selectedUnits.length < 2" class="text-sm text-gray-600">
          At least two units are needed to merge.
        </div>

        <div v-else class="space-y-4">
          <!-- What gets merged -->
          <div>
            <label class="label mb-1.5 block">Units to merge</label>
            <div class="space-y-1.5">
              <div v-for="u in selectedUnits" :key="u.id"
                class="border border-gray-200 bg-gray-50 rounded-lg p-2">
                <div class="flex items-center justify-between gap-2">
                  <div class="font-bold text-sm text-gray-900 truncate">{{ u.unit }}</div>
                  <span class="badge uppercase shrink-0"
                    :class="`status-bg-${u.status} status-text-${u.status}`">
                    {{ statusLabel(u.status) }}
                  </span>
                </div>
                <div class="text-sm text-gray-600 truncate">
                  {{ typeSummary(u) || 'No vehicles' }}
                  <span v-if="totalCrew(u)"> · {{ totalCrew(u) }} crew</span>
                  <span v-if="u.location"> · {{ u.location }}</span>
                </div>
              </div>
            </div>
            <p class="text-sm text-gray-600 mt-1.5">
              Result: {{ mergedVehicles.length }} {{ mergedVehicles.length === 1 ? 'vehicle' : 'vehicles' }} ·
              {{ mergedCrew }} crew
            </p>
          </div>

          <div>
            <label class="label mb-1.5 block">Merged unit name <span class="text-red-600">*</span></label>
            <input v-model="name" class="input" :class="{ '!border-red-500': errors.name }"
              placeholder="e.g. Enota 1" />
            <p v-if="errors.name" class="text-sm font-medium text-red-600 mt-1">{{ errors.name }}</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label mb-1.5 block">Status</label>
              <select v-model="status" class="input">
                <option v-for="s in STATUSES" :key="s" :value="s">{{ statusLabel(s) }}</option>
              </select>
            </div>
            <div>
              <label class="label mb-1.5 block">Location <span class="text-red-600">*</span></label>
              <select v-model="selectedLocation" @change="onLocationSelect" class="input"
                :class="{ '!border-red-500': errors.location }">
                <option value="">— Select —</option>
                <option v-for="s in sectors" :key="s.id" :value="s.name">{{ s.name }}</option>
                <option value="__custom__">Custom…</option>
              </select>
            </div>
          </div>
          <input v-if="showCustomLocation" ref="customLocationInput" v-model="location" class="input"
            :class="{ '!border-red-500': errors.location }" placeholder="Enter address or area" />
          <p v-if="errors.location" class="text-sm font-medium text-red-600 -mt-2">{{ errors.location }}</p>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label mb-1.5 block">Leader</label>
              <input v-model="leader" class="input" placeholder="Name" />
            </div>
            <div>
              <label class="label mb-1.5 block">Phone</label>
              <input v-model="leaderPhone" type="tel" class="input" placeholder="+386 ..." />
            </div>
          </div>

          <div>
            <label class="label mb-1.5 block">Notes</label>
            <textarea v-model="notes" class="input" rows="2" placeholder="Optional notes"></textarea>
          </div>

          <p v-if="differentStatuses" class="text-sm font-medium text-amber-700">
            The units have different statuses — the merged unit will use {{ statusLabel(status) }}.
          </p>
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="$emit('close')" class="btn-ghost flex-1">Cancel</button>
          <button @click="submit" :disabled="selectedUnits.length < 2"
            class="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
            Merge Units
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useYjs, updateUnit, removeUnit } from '../composables/useYjs.js'
import { normalizeVehicles, totalCrew, typeSummary } from '../composables/vehicles.js'
import { useToast } from '../composables/useToast.js'

const props = defineProps({
  unitIds: { type: Array, required: true },
})

const emit = defineEmits(['close'])

const { units, sectors, STATUSES } = useYjs()
const { add: addToast } = useToast()

const selectedUnits = computed(() =>
  props.unitIds.map(id => units.value.find(u => u.id === id)).filter(Boolean)
)

const mergedVehicles = computed(() => selectedUnits.value.flatMap(u => normalizeVehicles(u)))
const mergedCrew = computed(() => mergedVehicles.value.reduce((sum, v) => sum + (Number(v.crew) || 0), 0))
const differentStatuses = computed(() => new Set(selectedUnits.value.map(u => u.status)).size > 1)

const statusLabel = (s) => ({
  'en-route': 'V PRIHODU',
  'on-scene': 'NERAZPOREJENI',
  'triaged': 'V POSREDOVANJU',
  'transport': 'ODHOD',
  'cleared': 'DRUGO',
}[s] || s)

/* ---------- Fields (prefilled from the first selected unit) ---------- */
const name = ref('')
const status = ref('en-route')
const leader = ref('')
const leaderPhone = ref('')
const notes = ref('')
const location = ref('')
const selectedLocation = ref('')
const showCustomLocation = ref(false)
const customLocationInput = ref(null)

function onLocationSelect() {
  if (selectedLocation.value === '__custom__') {
    showCustomLocation.value = true
    location.value = ''
    nextTick(() => customLocationInput.value?.focus())
  } else {
    showCustomLocation.value = false
    location.value = selectedLocation.value
  }
}

onMounted(() => {
  const first = selectedUnits.value[0]
  if (!first) return
  name.value = first.unit
  status.value = first.status || 'en-route'
  leader.value = first.leader || ''
  leaderPhone.value = first.leaderPhone || ''
  notes.value = first.notes || ''
  location.value = first.location || ''
  if (location.value && sectors.value.some(s => s.name === location.value)) {
    selectedLocation.value = location.value
  } else if (location.value) {
    selectedLocation.value = '__custom__'
    showCustomLocation.value = true
  }
})

/* ---------- Submit ---------- */
const errors = reactive({ name: '', location: '' })

function validate() {
  errors.name = ''
  errors.location = ''
  let ok = true
  if (!name.value.trim()) { errors.name = 'Unit name is required'; ok = false }
  if (!location.value.trim()) { errors.location = 'Location is required'; ok = false }
  return ok
}

function submit() {
  if (selectedUnits.value.length < 2 || !validate()) return

  const [first, ...rest] = selectedUnits.value
  const count = selectedUnits.value.length
  const mergedName = name.value.trim()

  updateUnit(first.id, {
    unit: mergedName,
    status: status.value,
    location: location.value.trim(),
    leader: leader.value,
    leaderPhone: leaderPhone.value,
    notes: notes.value,
    vehicles: mergedVehicles.value,
  })
  for (const u of rest) removeUnit(u.id)

  addToast(`Merged ${count} units into ${mergedName}`, 'success')
  emit('close')
}
</script>

<style scoped>
.animate-slide-up {
  animation: slideUp 0.2s ease-out;
}
@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@media (min-width: 640px) {
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
}
</style>
