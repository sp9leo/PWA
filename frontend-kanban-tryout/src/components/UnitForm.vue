<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center" @click.self="$emit('close')">
      <div class="absolute inset-0 bg-gray-900/30 backdrop-blur-sm"></div>
      <div class="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-slide-up">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-bold">{{ editId ? 'Edit Unit' : 'Add Unit' }}</h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-900 text-xl leading-none">&times;</button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="label mb-1.5 block">Unit Name <span class="text-red-600">*</span></label>
            <input v-model="form.unit" list="unit-suggestions" class="input" :class="{ '!border-red-500': errors.unit }"
              placeholder="e.g. Engine 4" @input="onUnitInput" />
            <datalist id="unit-suggestions">
              <option v-for="u in predefinedUnits" :key="u.id" :value="u.name" />
            </datalist>
            <p v-if="errors.unit" class="text-sm font-medium text-red-600 mt-1">{{ errors.unit }}</p>
          </div>
          <div>
            <label class="label mb-1.5 block">Status</label>
            <select v-model="form.status" class="input">
              <option v-for="s in STATUSES" :key="s" :value="s">{{ statusLabel(s) }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label mb-1.5 block">Unit Leader</label>
              <input v-model="form.leader" class="input" placeholder="Name" />
            </div>
            <div>
              <label class="label mb-1.5 block">Phone</label>
              <input v-model="form.leaderPhone" type="tel" class="input" placeholder="+386 ..." />
            </div>
          </div>
          <div>
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <label class="label block">Vehicles &amp; crew</label>
              <span class="text-sm font-bold text-gray-700">{{ totalCrew }} crew total</span>
            </div>
            <div class="space-y-2">
              <div v-for="(v, i) in form.vehicles" :key="v._key"
                class="bg-gray-50 border border-gray-200 rounded-lg p-2 space-y-2">
                <div class="flex flex-wrap items-end gap-2">
                  <div class="flex-1 min-w-32">
                    <label class="text-sm font-semibold text-gray-700 mb-1 block">Type</label>
                    <input v-model="v.type" list="admin-vehicle-types" class="input-sm" placeholder="e.g. GVGP-1"
                      @input="onVehicleType(v)" />
                  </div>
                  <div class="flex-1 min-w-32">
                    <label class="text-sm font-semibold text-gray-700 mb-1 block">Call sign</label>
                    <input v-model="v.callSign" class="input-sm" placeholder="e.g. GVC 01" />
                  </div>
                  <button type="button" @click="removeVehicle(i)" :disabled="form.vehicles.length === 1"
                    class="w-9 h-9 shrink-0 mb-0.5 flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:text-gray-300 disabled:hover:bg-transparent text-lg leading-none transition-colors"
                    title="Remove vehicle">&times;</button>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold text-gray-700 shrink-0">Crew</span>
                  <div v-if="v.type.trim()" class="flex flex-wrap items-center gap-1">
                    <button v-for="n in 9" :key="n" type="button" @click="v.crew = n"
                      class="w-8 h-8 rounded-md text-sm font-bold transition-colors"
                      :class="v.crew === n ? 'bg-blue-700 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'"
                      :aria-pressed="v.crew === n">{{ n }}</button>
                  </div>
                  <input v-else v-model.number="v.crew" type="number" min="0" max="99" inputmode="numeric"
                    class="input-sm w-20" aria-label="Crew" />
                </div>
              </div>
            </div>
            <button type="button" @click="addVehicle"
              class="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
              <span class="text-base leading-none">+</span> Add vehicle
            </button>
            <datalist id="admin-vehicle-types">
              <option v-for="t in typeNames" :key="t" :value="t" />
            </datalist>
          </div>
          <div>
            <label class="label mb-1.5 block">Location <span class="text-red-600">*</span></label>
            <select v-model="selectedLocation" @change="onLocationSelect" class="input"
              :class="{ '!border-red-500': errors.location }">
              <option value="">— Select —</option>
              <option v-for="s in sectors" :key="s.id" :value="s.name">{{ s.name }}</option>
              <option value="__custom__">Custom…</option>
            </select>
            <input v-if="showCustomLocation" ref="customLocationInput" v-model="form.location" class="input mt-2"
              :class="{ '!border-red-500': errors.location }" placeholder="Enter address or area"
              @input="errors.location = ''" />
            <p v-if="errors.location" class="text-sm font-medium text-red-600 mt-1">{{ errors.location }}</p>
          </div>
          <div>
            <label class="label mb-1.5 block">Notes</label>
            <textarea v-model="form.notes" class="input" rows="3" placeholder="Optional notes"></textarea>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="$emit('close')" class="btn-ghost flex-1">Cancel</button>
          <button @click="submit" class="btn-primary flex-1">{{ editId ? 'Save' : 'Add Unit' }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { useYjs, addUnit, updateUnit } from '../composables/useYjs.js'
import { normalizeVehicles } from '../composables/vehicles.js'
import { useToast } from '../composables/useToast.js'

const props = defineProps({
  presetStatus: { type: String, default: 'en-route' },
  editId: { type: String, default: '' },
})

const emit = defineEmits(['close'])

const { units: allUnits, STATUSES, predefinedUnits, sectors, unitTypes } = useYjs()

function onUnitInput() {
  const match = predefinedUnits.value.find(u => u.name === form.unit)
  if (!match) return
  form.status = match.defaultStatus
  if (match.type && form.vehicles.length === 1 && !form.vehicles[0].type) {
    form.vehicles[0].type = match.type
  }
}
const { add: addToast } = useToast()

const typeNames = computed(() => unitTypes.value.map(t => t.name))

let vehicleKeySeq = 0
function blankVehicle(overrides = {}) {
  return {
    _key: ++vehicleKeySeq,
    id: '',
    type: '',
    crew: 1,
    callSign: '',
    ...overrides,
  }
}

const TYPE_CREW_MAX = 9

/** Typed vehicles carry at most 9 crew; without a type the counter stays free. */
function onVehicleType(v) {
  if (!String(v.type || '').trim()) return
  const crew = Number(v.crew) || 0
  if (crew < 1) v.crew = 1
  else if (crew > TYPE_CREW_MAX) v.crew = TYPE_CREW_MAX
}

const selectedLocation = ref('')
const showCustomLocation = ref(false)
const customLocationInput = ref(null)

function onLocationSelect() {
  if (selectedLocation.value === '__custom__') {
    showCustomLocation.value = true
    form.location = ''
    nextTick(() => customLocationInput.value?.focus())
  } else {
    showCustomLocation.value = false
    form.location = selectedLocation.value
  }
}

const form = reactive({
  unit: '',
  status: props.presetStatus || 'en-route',
  leader: '',
  leaderPhone: '',
  location: '',
  notes: '',
  vehicles: [blankVehicle()],
})

const totalCrew = computed(() =>
  form.vehicles.reduce((sum, v) => sum + (Number(v.crew) || 0), 0)
)

function addVehicle() {
  form.vehicles.push(blankVehicle())
}

function removeVehicle(index) {
  if (form.vehicles.length > 1) form.vehicles.splice(index, 1)
}

const errors = reactive({ unit: '', location: '' })

onMounted(() => {
  if (props.editId) {
    const u = allUnits.value.find(x => x.id === props.editId)
    if (u) {
      form.unit = u.unit
      form.status = u.status
      form.leader = u.leader || ''
      form.leaderPhone = u.leaderPhone || ''
      form.location = u.location
      form.notes = u.notes

      const vehicles = normalizeVehicles(u)
      form.vehicles = (vehicles.length ? vehicles : [blankVehicle()]).map(v =>
        blankVehicle({ id: v.id, type: v.type, crew: v.crew, callSign: v.callSign })
      )

      if (u.location) {
        const sectorNames = sectors.value.map(s => s.name)
        if (sectorNames.includes(u.location)) {
          selectedLocation.value = u.location
        } else {
          selectedLocation.value = '__custom__'
          showCustomLocation.value = true
        }
      }
    }
  }
})

// Close modal with Escape key
onMounted(() => {
  const onEsc = (e) => { if (e.key === 'Escape') emit('close') }
  window.addEventListener('keydown', onEsc)
  onBeforeUnmount(() => window.removeEventListener('keydown', onEsc))
})

const statusLabel = (s) => ({ 'en-route': 'V PRIHODU', 'on-scene': 'NERAZPOREJENI', 'triaged': 'V POSREDOVANJU', 'transport': 'ODHOD', 'cleared': 'DRUGO' }[s] || s)

function validate() {
  let ok = true
  if (!form.unit.trim()) { errors.unit = 'Unit name is required'; ok = false }
  if (!form.location.trim()) { errors.location = 'Location is required'; ok = false }
  return ok
}

function submit() {
  if (!validate()) return
  const payload = {
    unit: form.unit,
    status: form.status,
    leader: form.leader,
    leaderPhone: form.leaderPhone,
    location: form.location,
    notes: form.notes,
    vehicles: form.vehicles.map(({ _key, ...v }) => v),
  }
  if (props.editId) {
    updateUnit(props.editId, payload)
    addToast('Unit updated', 'success')
  } else {
    addUnit(payload)
    addToast('Unit added', 'success')
  }
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
