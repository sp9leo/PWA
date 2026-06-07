import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'
import { shallowRef, triggerRef } from 'vue'
import { nanoid } from './nanoid.js'

let doc, yUnits, yActivity, wsProvider, indexeddbProvider
const connected = shallowRef(false)
const synced = shallowRef(false)
const units = shallowRef([])
const activities = shallowRef([])
const version = shallowRef(0)
let initialized = false
let observeFn, activityObserveFn

const STATUSES = ['en-route', 'on-scene', 'triaged', 'transport', 'cleared']
const MAX_ACTIVITY = 500

function init() {
  if (initialized) return
  initialized = true

  doc = new Y.Doc()
  yUnits = doc.getArray('units')
  yActivity = doc.getArray('activity')

  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.hostname
  const port = import.meta.env.VITE_WS_PORT || '1234'

  wsProvider = new WebsocketProvider(`${proto}//${host}:${port}`, 'incident-tracker', doc)
  indexeddbProvider = new IndexeddbPersistence('incident-tracker', doc)

  wsProvider.on('status', (e) => { connected.value = e.status === 'connected' })
  wsProvider.on('sync', (s) => { synced.value = s })

  indexeddbProvider.whenSynced.then(() => {
    if (yUnits.length === 0) {
      seedDemoData()
    }
    syncAll()
  })

  observeFn = () => { syncUnits() }
  yUnits.observeDeep(observeFn)

  activityObserveFn = () => { syncActivities() }
  yActivity.observeDeep(activityObserveFn)
}

function syncAll() {
  syncUnits()
  syncActivities()
}

function syncUnits() {
  units.value = yUnits.toArray().map(m => {
    const obj = m.toJSON()
    obj._yMap = m
    return obj
  })
  triggerRef(units)
  version.value++
}

function syncActivities() {
  activities.value = yActivity.toArray().map(m => m.toJSON()).reverse()
  triggerRef(activities)
}

function seedDemoData() {
  const demos = [
    { unit: 'Engine 4', status: 'en-route', location: '1420 Oak Ave', notes: '' },
    { unit: 'Truck 2', status: 'on-scene', location: '3550 Maple Dr', notes: 'Working structure fire' },
    { unit: 'Ambulance 7', status: 'triaged', location: '3550 Maple Dr', notes: '2 patients, minor injuries' },
    { unit: 'Engine 1', status: 'cleared', location: '899 Pine St', notes: 'False alarm' },
    { unit: 'Rescue 3', status: 'transport', location: '3550 Maple Dr', notes: 'Transport to County Med' },
  ]
  const now = Date.now()
  doc.transact(() => {
    demos.forEach((d, i) => {
      const m = new Y.Map()
      m.set('id', nanoid())
      m.set('unit', d.unit)
      m.set('status', d.status)
      m.set('location', d.location)
      m.set('notes', d.notes)
      m.set('createdAt', now + i * 1000)
      m.set('updatedAt', now + i * 1000)
      yUnits.push([m])
    })
  })
}

function pushActivity(unitId, unitName, fromStatus, toStatus) {
  const a = new Y.Map()
  a.set('id', nanoid())
  a.set('unitId', unitId)
  a.set('unitName', unitName)
  a.set('fromStatus', fromStatus)
  a.set('toStatus', toStatus)
  a.set('timestamp', Date.now())
  yActivity.push([a])
  if (yActivity.length > MAX_ACTIVITY) {
    yActivity.delete(0, yActivity.length - MAX_ACTIVITY)
  }
}

export function useYjs() {
  init()
  return { units, connected, synced, activities, version, addUnit, updateUnit, removeUnit, moveUnit, reorderUnits, STATUSES }
}

export function addUnit(data) {
  const now = Date.now()
  const m = new Y.Map()
  m.set('id', nanoid())
  m.set('unit', data.unit || '')
  m.set('status', data.status || 'en-route')
  m.set('location', data.location || '')
  m.set('notes', data.notes || '')
  m.set('createdAt', now)
  m.set('updatedAt', now)
  doc.transact(() => {
    yUnits.push([m])
    pushActivity(m.get('id'), m.get('unit'), '', m.get('status'))
  })
}

export function updateUnit(id, data) {
  for (const m of yUnits) {
    if (m.get('id') === id) {
      const oldStatus = m.get('status')
      doc.transact(() => {
        for (const [k, v] of Object.entries(data)) {
          if (v !== undefined) m.set(k, v)
        }
        m.set('updatedAt', Date.now())
        if (data.status && data.status !== oldStatus) {
          pushActivity(id, m.get('unit'), oldStatus, data.status)
        }
      })
      return
    }
  }
}

export function removeUnit(id) {
  let removed
  doc.transact(() => {
    for (let i = 0; i < yUnits.length; i++) {
      if (yUnits.get(i).get('id') === id) {
        removed = yUnits.get(i)
        yUnits.delete(i)
        break
      }
    }
  })
  return removed ? { id, name: removed.get('unit') } : null
}

export function moveUnit(id, newStatus) {
  updateUnit(id, { status: newStatus, updatedAt: Date.now() })
}

export function reorderUnits(orderedIds) {
  const now = Date.now()
  doc.transact(() => {
    orderedIds.forEach((id, index) => {
      for (const m of yUnits) {
        if (m.get('id') === id) {
          m.set('updatedAt', now - index)
          break
        }
      }
    })
  })
}

export function syncKanbanState(columns) {
  const now = Date.now()
  doc.transact(() => {
    for (const [status, ids] of Object.entries(columns)) {
      ids.forEach((id, index) => {
        for (const m of yUnits) {
          if (m.get('id') === id) {
            const oldStatus = m.get('status')
            if (status !== oldStatus) {
              m.set('status', status)
              if (oldStatus) pushActivity(id, m.get('unit'), oldStatus, status)
            }
            m.set('updatedAt', now - index)
            break
          }
        }
      })
    }
  })
}

export { connected }

export function cleanup() {
  if (yUnits && observeFn) yUnits.unobserveDeep(observeFn)
  if (yActivity && activityObserveFn) yActivity.unobserveDeep(activityObserveFn)
  wsProvider?.destroy()
  indexeddbProvider?.destroy()
  doc?.destroy()
}
