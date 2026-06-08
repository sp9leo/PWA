import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'
import { shallowRef, ref } from 'vue'
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

  wsProvider.on('sync', s => {
    synced.value = s
  })

  // initial hydration (with fallback timeout)
  let seeded = false
  indexeddbProvider.whenSynced.then(() => {
    if (yUnits.length === 0) seedDemoData()
    seeded = true
    hydrate()
  }).catch(() => { seeded = true })

  setTimeout(() => {
    if (!seeded && yUnits.length === 0) seedDemoData()
    hydrate()
    seeded = true
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

function now() {
  return Date.now()
}

/* ================================
   SEED
================================ */

function seedDemoData() {
  const base = now()

  const demo = [
    ['Engine 4', 'en-route', '1420 Oak Ave'],
    ['Truck 2', 'on-scene', '3550 Maple Dr'],
    ['Ambulance 7', 'triaged', '3550 Maple Dr'],
    ['Rescue 3', 'transport', '3550 Maple Dr'],
    ['Engine 1', 'cleared', '899 Pine St'],
  ]

  const defaultTypes = ['GVGP-1', 'GVGP-2', 'GVV-V', 'GVM', 'GVC-1', 'GVC-2', 'GVC-3', 'AC', 'ALK']

  doc.transact(() => {
    demo.forEach(([unit, status, location], i) => {
      const m = new Y.Map()

      m.set('id', nanoid())
      m.set('unit', unit)
      m.set('status', status)
      m.set('location', location)
      m.set('notes', '')
      m.set('createdAt', base + i * 1000)
      m.set('updatedAt', base + i * 1000)

      yUnits.push([m])
    })

    defaultTypes.forEach(name => {
      const m = new Y.Map()
      m.set('id', nanoid())
      m.set('name', name)
      yUnitTypes.push([m])
    })

    const defaultColumns = [
      { label: 'En Route', statusKey: 'en-route' },
      { label: 'On Scene', statusKey: 'on-scene' },
      { label: 'Triaged', statusKey: 'triaged' },
      { label: 'Transport', statusKey: 'transport' },
      { label: 'Cleared', statusKey: 'cleared' },
    ]
    defaultColumns.forEach((col, i) => {
      const m = new Y.Map()
      m.set('id', nanoid())
      m.set('label', col.label)
      m.set('statusKey', col.statusKey)
      m.set('order', i)
      yKanbanColumns.push([m])
    })
  })
}

/* ================================
   ACTIVITY
================================ */

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
================================ */

export function addUnit(data = {}) {
  const t = now()
  const m = new Y.Map()

  m.set('id', nanoid())
  m.set('unit', data.unit || '')
  m.set('status', data.status || 'en-route')
  m.set('location', data.location || '')
  m.set('type', data.type || '')
  m.set('leader', data.leader || '')
  m.set('leaderPhone', data.leaderPhone || '')
  m.set('personnelCount', data.personnelCount || 1)
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
}

export function updateUnit(id, patch = {}) {
  const m = findMapById(id)
  if (!m) return

  const prevStatus = m.get('status')

  doc.transact(() => {
    Object.entries(patch).forEach(([k, v]) => {
      if (v !== undefined) m.set(k, v)
    })

    const nextStatus = patch.status

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
=============================== */

function findAdminMap(yarray, id) {
  return yarray.toArray().find(m => m.get('id') === id)
}

export function addPredefinedUnit(data = {}) {
  const m = new Y.Map()
  m.set('id', nanoid())
  m.set('name', data.name || '')
  m.set('type', data.type || '')
  m.set('defaultStatus', data.defaultStatus || 'en-route')
  doc.transact(() => { yPredefinedUnits.push([m]) })
}

export function updatePredefinedUnit(id, data = {}) {
  const m = findAdminMap(yPredefinedUnits, id)
  if (!m) return
  doc.transact(() => {
    if (data.name !== undefined) m.set('name', data.name)
    if (data.type !== undefined) m.set('type', data.type)
    if (data.defaultStatus !== undefined) m.set('defaultStatus', data.defaultStatus)
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