import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'
import { shallowRef, ref, computed } from 'vue'
import { nanoid } from './nanoid.js'

/* ================================
   STATE
================================ */

let doc
let yUnits
let yActivity
let yPredefinedUnits
let ySectors
let yRadioChannels
let yUnitTypes
let yKanbanColumns
let yAdminSettings
let wsProvider
let indexeddbProvider

const units = shallowRef([])
const activities = shallowRef([])
export const connected = shallowRef(false)
const synced = shallowRef(false)

const predefinedUnits = shallowRef([])
const sectors = shallowRef([])
const radioChannels = shallowRef([])
const unitTypes = shallowRef([])
const kanbanColumns = shallowRef([])
export const pinCode = shallowRef('')
export const readOnly = shallowRef(false)

export function setReadOnly(value = true) {
  readOnly.value = !!value
}

const STATUSES = ['en-route', 'on-scene', 'triaged', 'transport', 'cleared']
const MAX_ACTIVITY = 500

let initialized = false

/* ================================
   INIT
================================ */

function init() {
  if (initialized) return
  initialized = true

  doc = new Y.Doc()
  yUnits = doc.getArray('units')
  yActivity = doc.getArray('activity')
  yPredefinedUnits = doc.getArray('predefinedUnits')
  ySectors = doc.getArray('sectors')
  yRadioChannels = doc.getArray('radioChannels')
  yUnitTypes = doc.getArray('unitTypes')
  yKanbanColumns = doc.getArray('kanbanColumns')
  yAdminSettings = doc.getMap('adminSettings')

  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = location.hostname
  const port = import.meta.env.VITE_WS_PORT || '1234'

  wsProvider = new WebsocketProvider(
    `${proto}//${host}:${port}`,
    'incident-tracker',
    doc
  )

  indexeddbProvider = new IndexeddbPersistence(
    'incident-tracker',
    doc
  )

  wsProvider.on('status', e => {
    connected.value = e.status === 'connected'
  })

  wsProvider.on('sync', isSynced => {
    synced.value = isSynced
    if (isSynced) {
      doc.transact(() => {
        deduplicateTypes()
        deduplicateColumns()
      })
      hydrate()
    }
  })

  // initial hydration (with fallback timeout)
  indexeddbProvider.whenSynced.then(() => {
    if (!yAdminSettings.get('seeded')) seedDefaults()
    hydrate()
  }).catch(() => hydrate())

  setTimeout(() => {
    if (!yAdminSettings.get('seeded')) seedDefaults()
    hydrate()
  }, 2000)

  // observers
  const update = () => {
    hydrate()
  }

  yUnits.observeDeep(update)
  yActivity.observeDeep(update)
  yPredefinedUnits.observeDeep(update)
  ySectors.observeDeep(update)
  yRadioChannels.observeDeep(update)
  yUnitTypes.observeDeep(update)
  yKanbanColumns.observeDeep(update)
  yAdminSettings.observe(update)
}

/* ================================
   HYDRATION
================================ */

function hydrate() {
  units.value = yUnits.toArray().map(toUnit)
  activities.value = yActivity.toArray().map(a => a.toJSON()).reverse()
  predefinedUnits.value = yPredefinedUnits.toArray().map(m => m.toJSON())
  sectors.value = ySectors.toArray().map(m => m.toJSON())
  radioChannels.value = yRadioChannels.toArray().map(m => m.toJSON())
  unitTypes.value = yUnitTypes.toArray().map(m => m.toJSON())
  kanbanColumns.value = yKanbanColumns.toArray().map(m => m.toJSON())
  pinCode.value = (yAdminSettings.toJSON().pinCode) || ''
}

/* ================================
   HELPERS
================================ */

function toUnit(m) {
  const obj = m.toJSON()
  obj._y = m
  return obj
}

function findMapById(id) {
  return yUnits.toArray().find(m => m.get('id') === id)
}

/**
 * Clean an incoming vehicles array and give each row a stable id.
 * Returns null when the caller did not provide vehicles at all,
 * so legacy `type` / `personnelCount` updates still work.
 */
function normalizeVehicleInput(list) {
  if (!Array.isArray(list)) return null
  return list
    .map(v => ({
      id: (v && v.id) || nanoid(),
      type: String(v?.type || '').trim(),
      crew: Math.max(0, Math.min(99, Number(v?.crew) || 0)),
      callSign: String(v?.callSign || '').trim(),
    }))
    .filter(v => v.type || v.crew || v.callSign)
}

function now() {
  return Date.now()
}

/* ================================
   SEED (default types + kanban columns)
=============================== */

function seedDefaults() {
  doc.transact(() => {
    if (yAdminSettings.get('seeded')) return

    const existingTypes = new Set(yUnitTypes.toArray().map(m => m.get('name')))
    const existingColumns = new Set(yKanbanColumns.toArray().map(m => m.get('label')))

    const defaultTypes = ['GVGP-1', 'GVGP-2', 'GVV-V', 'GVM', 'GVC-1', 'GVC-2', 'GVC-3', 'AC', 'ALK']
    defaultTypes.forEach(name => {
      if (existingTypes.has(name)) return
      const m = new Y.Map()
      m.set('id', nanoid())
      m.set('name', name)
      yUnitTypes.push([m])
    })

    const defaultColumns = [
      { label: 'V PRIHODU', statusKey: 'en-route' },
      { label: 'NERAZPOREJENI', statusKey: 'on-scene' },
      { label: 'V POSREDOVANJU', statusKey: 'triaged' },
      { label: 'ODHOD', statusKey: 'transport' },
      { label: 'DRUGO', statusKey: 'cleared' },
    ]
    defaultColumns.forEach((col, i) => {
      if (existingColumns.has(col.label)) return
      const m = new Y.Map()
      m.set('id', nanoid())
      m.set('label', col.label)
      m.set('statusKey', col.statusKey)
      m.set('order', i)
      yKanbanColumns.push([m])
    })

    yAdminSettings.set('seeded', true)
  })
}

function deduplicateTypes() {
  const seen = new Set()
  for (let i = yUnitTypes.length - 1; i >= 0; i--) {
    const name = yUnitTypes.get(i).get('name')
    if (seen.has(name) || !name) { yUnitTypes.delete(i, 1); continue }
    seen.add(name)
  }
}

function deduplicateColumns() {
  const seen = new Set()
  for (let i = yKanbanColumns.length - 1; i >= 0; i--) {
    const label = yKanbanColumns.get(i).get('label')
    if (seen.has(label) || !label) { yKanbanColumns.delete(i, 1); continue }
    seen.add(label)
  }
}

/* ================================
   ACTIVITY
=============================== */

function pushActivity({ id, name, from, to }) {
  const a = new Y.Map()

  a.set('id', nanoid())
  a.set('unitId', id)
  a.set('unitName', name)
  a.set('fromStatus', from)
  a.set('toStatus', to)
  a.set('timestamp', now())

  yActivity.push([a])

  if (yActivity.length > MAX_ACTIVITY) {
    yActivity.delete(0, yActivity.length - MAX_ACTIVITY)
  }
}

/* ================================
   CRUD
=============================== */

export function addUnit(data = {}) {
  if (readOnly.value) return
  const t = now()
  const m = new Y.Map()
  const vehicles = normalizeVehicleInput(data.vehicles) || []

  m.set('id', nanoid())
  m.set('unit', data.unit || '')
  m.set('status', data.status || 'en-route')
  m.set('location', data.location || '')
  m.set('vehicles', vehicles)
  m.set('type', vehicles[0]?.type || data.type || '')
  m.set('leader', data.leader || '')
  m.set('leaderPhone', data.leaderPhone || '')
  m.set('personnelCount', vehicles.length
    ? vehicles.reduce((sum, v) => sum + v.crew, 0)
    : (data.personnelCount || 1))
  m.set('notes', data.notes || '')
  m.set('createdAt', t)
  m.set('updatedAt', t)

  doc.transact(() => {
    yUnits.push([m])
    pushActivity({
      id: m.get('id'),
      name: m.get('unit'),
      from: '',
      to: m.get('status'),
    })
  })

  return m.get('id')
}

export function updateUnit(id, patch = {}) {
  if (readOnly.value) return
  const m = findMapById(id)
  if (!m) return

  const prevStatus = m.get('status')
  const next = { ...patch }
  const vehicles = normalizeVehicleInput(next.vehicles)

  if (vehicles) {
    next.vehicles = vehicles
    next.type = vehicles[0]?.type || ''
    next.personnelCount = vehicles.reduce((sum, v) => sum + v.crew, 0)
  }

  doc.transact(() => {
    Object.entries(next).forEach(([k, v]) => {
      if (v !== undefined) m.set(k, v)
    })

    const nextStatus = next.status

    if (nextStatus && nextStatus !== prevStatus) {
      pushActivity({
        id,
        name: m.get('unit'),
        from: prevStatus,
        to: nextStatus,
      })
    }

    m.set('updatedAt', now())
  })
}

export function moveUnit(id, status) {
  updateUnit(id, { status })
}

export function removeUnit(id) {
  if (readOnly.value) return
  doc.transact(() => {
    for (let i = 0; i < yUnits.length; i++) {
      const m = yUnits.get(i)

      if (m.get('id') === id) {
        yUnits.delete(i)
        break
      }
    }
  })
}

/* ================================
   ADMIN CRUD
============================== */

function findAdminMap(yarray, id) {
  return yarray.toArray().find(m => m.get('id') === id)
}

export function addPredefinedUnit(data = {}) {
  const m = new Y.Map()
  m.set('id', nanoid())
  m.set('name', data.name || '')
  m.set('type', data.type || '')
  m.set('defaultStatus', data.defaultStatus || 'en-route')
  m.set('pin', data.pin || '')
  m.set('department', data.department || '')
  doc.transact(() => { yPredefinedUnits.push([m]) })
}

export function updatePredefinedUnit(id, data = {}) {
  const m = findAdminMap(yPredefinedUnits, id)
  if (!m) return
  doc.transact(() => {
    if (data.name !== undefined) m.set('name', data.name)
    if (data.type !== undefined) m.set('type', data.type)
    if (data.defaultStatus !== undefined) m.set('defaultStatus', data.defaultStatus)
    if (data.pin !== undefined) m.set('pin', data.pin)
    if (data.department !== undefined) m.set('department', data.department)
  })
}

export function removePredefinedUnit(id) {
  doc.transact(() => {
    for (let i = 0; i < yPredefinedUnits.length; i++) {
      if (yPredefinedUnits.get(i).get('id') === id) { yPredefinedUnits.delete(i); break }
    }
  })
}

export function addSector(data = {}) {
  const m = new Y.Map()
  m.set('id', nanoid())
  m.set('name', data.name || '')
  m.set('description', data.description || '')
  doc.transact(() => { ySectors.push([m]) })
}

export function updateSector(id, data = {}) {
  const m = findAdminMap(ySectors, id)
  if (!m) return
  doc.transact(() => {
    if (data.name !== undefined) m.set('name', data.name)
    if (data.description !== undefined) m.set('description', data.description)
  })
}

export function removeSector(id) {
  doc.transact(() => {
    for (let i = 0; i < ySectors.length; i++) {
      if (ySectors.get(i).get('id') === id) { ySectors.delete(i); break }
    }
  })
}

export function addRadioChannel(data = {}) {
  const m = new Y.Map()
  m.set('id', nanoid())
  m.set('name', data.name || '')
  m.set('frequency', data.frequency || '')
  m.set('description', data.description || '')
  doc.transact(() => { yRadioChannels.push([m]) })
}

export function updateRadioChannel(id, data = {}) {
  const m = findAdminMap(yRadioChannels, id)
  if (!m) return
  doc.transact(() => {
    if (data.name !== undefined) m.set('name', data.name)
    if (data.frequency !== undefined) m.set('frequency', data.frequency)
    if (data.description !== undefined) m.set('description', data.description)
  })
}

export function removeRadioChannel(id) {
  doc.transact(() => {
    for (let i = 0; i < yRadioChannels.length; i++) {
      if (yRadioChannels.get(i).get('id') === id) { yRadioChannels.delete(i); break }
    }
  })
}

export function addUnitType(data = {}) {
  const m = new Y.Map()
  m.set('id', nanoid())
  m.set('name', data.name || '')
  doc.transact(() => { yUnitTypes.push([m]) })
}

export function updateUnitType(id, data = {}) {
  const m = findAdminMap(yUnitTypes, id)
  if (!m) return
  doc.transact(() => {
    if (data.name !== undefined) m.set('name', data.name)
  })
}

export function removeUnitType(id) {
  doc.transact(() => {
    for (let i = 0; i < yUnitTypes.length; i++) {
      if (yUnitTypes.get(i).get('id') === id) { yUnitTypes.delete(i); break }
    }
  })
}

export function addKanbanColumn(data = {}) {
  const m = new Y.Map()
  m.set('id', nanoid())
  m.set('label', data.label || 'New')
  m.set('statusKey', data.statusKey || 'en-route')
  m.set('order', data.order ?? yKanbanColumns.length)
  doc.transact(() => { yKanbanColumns.push([m]) })
}

export function updateKanbanColumn(id, data = {}) {
  const m = findAdminMap(yKanbanColumns, id)
  if (!m) return
  doc.transact(() => {
    if (data.label !== undefined) m.set('label', data.label)
    if (data.statusKey !== undefined) m.set('statusKey', data.statusKey)
    if (data.order !== undefined) m.set('order', data.order)
  })
}

export function removeKanbanColumn(id) {
  doc.transact(() => {
    for (let i = 0; i < yKanbanColumns.length; i++) {
      if (yKanbanColumns.get(i).get('id') === id) { yKanbanColumns.delete(i); break }
    }
  })
}

export function setPinCode(code) {
  yAdminSettings.set('pinCode', code)
}

/* ================================
   EXPORT / IMPORT
================================= */

export function exportData() {
  const data = {
    version: 1,
    exportedAt: now(),
    units: yUnits.toArray().map(m => m.toJSON()),
    activities: yActivity.toArray().map(m => m.toJSON()),
    predefinedUnits: yPredefinedUnits.toArray().map(m => m.toJSON()),
    sectors: ySectors.toArray().map(m => m.toJSON()),
    radioChannels: yRadioChannels.toArray().map(m => m.toJSON()),
    unitTypes: yUnitTypes.toArray().map(m => m.toJSON()),
    kanbanColumns: yKanbanColumns.toArray().map(m => m.toJSON()),
    adminSettings: yAdminSettings.toJSON(),
  }
  return data
}

function clearYArray(arr) {
  while (arr.length > 0) {
    arr.delete(0, 1)
  }
}

export function importData(data) {
  if (!data || data.version !== 1) {
    throw new Error('Invalid export format')
  }

  doc.transact(() => {
    clearYArray(yUnits)
    clearYArray(yActivity)
    clearYArray(yPredefinedUnits)
    clearYArray(ySectors)
    clearYArray(yRadioChannels)
    clearYArray(yUnitTypes)
    clearYArray(yKanbanColumns)

    const addMaps = (yarray, items) => {
      items.forEach(item => {
        const m = new Y.Map()
        for (const [k, v] of Object.entries(item)) {
          if (k === '_y') return
          m.set(k, v)
        }
        yarray.push([m])
      })
    }

    addMaps(yUnits, data.units || [])
    addMaps(yActivity, data.activities || [])
    addMaps(yPredefinedUnits, data.predefinedUnits || [])
    addMaps(ySectors, data.sectors || [])
    addMaps(yRadioChannels, data.radioChannels || [])
    addMaps(yUnitTypes, data.unitTypes || [])
    addMaps(yKanbanColumns, data.kanbanColumns || [])

    if (data.adminSettings) {
      for (const [k, v] of Object.entries(data.adminSettings)) {
        yAdminSettings.set(k, v)
      }
    }
  })
}

/* ================================
   KANBAN LOGIC (IMPORTANT)
=============================== */

export function syncKanbanState(columns) {
  doc.transact(() => {
    for (const [status, ids] of Object.entries(columns)) {
      ids.forEach((id, index) => {
        const m = findMapById(id)
        if (!m) return

        const prev = m.get('status')

        if (prev !== status) {
          m.set('status', status)
          m.set('updatedAt', now())

          pushActivity({
            id,
            name: m.get('unit'),
            from: prev,
            to: status,
          })
        }

        m.set('order', index)
      })
    }
  })
}

/* ================================
   COMPOSABLE
================================ */

export function useYjs() {
  init()

  /* -------------------------------
     Counters
  ------------------------------ */
  const totalUnits = computed(() => units.value.length)

  const unitsByStatus = computed(() => {
    const counts = {}
    STATUSES.forEach(s => { counts[s] = 0 })
    units.value.forEach(u => {
      counts[u.status] = (counts[u.status] || 0) + 1
    })
    return counts
  })

  const totalCrew = computed(() =>
    units.value.reduce((sum, u) => sum + (u.personnelCount || 0), 0)
  )

  const crewByStatus = computed(() => {
    const counts = {}
    STATUSES.forEach(s => { counts[s] = 0 })
    units.value.forEach(u => {
      counts[u.status] = (counts[u.status] || 0) + (u.personnelCount || 0)
    })
    return counts
  })

  return {
    units,
    activities,
    connected,
    synced,
    STATUSES,
    predefinedUnits,
    sectors,
    radioChannels,
    unitTypes,
    kanbanColumns,
    pinCode,
    readOnly,
    setReadOnly,

    totalUnits,
    unitsByStatus,
    totalCrew,
    crewByStatus,

    addUnit,
    updateUnit,
    removeUnit,
    syncKanbanState,

    addPredefinedUnit,
    updatePredefinedUnit,
    removePredefinedUnit,
    addSector,
    updateSector,
    removeSector,
    addRadioChannel,
    updateRadioChannel,
    removeRadioChannel,
    addUnitType,
    updateUnitType,
    removeUnitType,
    addKanbanColumn,
    updateKanbanColumn,
    removeKanbanColumn,
    setPinCode,
    exportData,
    importData,
  }
}

/* ================================
   CLEANUP (optional)
================================ */

export function cleanup() {
  wsProvider?.destroy()
  indexeddbProvider?.destroy()
  doc?.destroy()
}