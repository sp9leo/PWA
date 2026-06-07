#!/usr/bin/env node

import http from 'http'
import { WebSocketServer } from 'ws'
import * as Y from 'yjs'
import * as syncProtocol from '@y/protocols/sync'
import * as awarenessProtocol from '@y/protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import * as map from 'lib0/map'
import { LeveldbPersistence } from 'y-leveldb'

// ---- Persistence ----

const ldb = new LeveldbPersistence(process.env.YPERSISTENCE || './data')

// ---- Yjs Document Manager (adapted from y-websocket-server/utils) ----

const docs = new Map()
const messageSync = 0
const messageAwareness = 1
const pingTimeout = 30000
const gcEnabled = true

let persistence = null

export const setPersistence = (p) => { persistence = p }

const updateHandler = (update, _origin, doc, _tr) => {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, messageSync)
  syncProtocol.writeUpdate(encoder, update)
  const message = encoding.toUint8Array(encoder)
  doc.conns.forEach((_, conn) => send(doc, conn, message))
}

class WSSharedDoc extends Y.Doc {
  constructor(name) {
    super({ gc: gcEnabled })
    this.name = name
    this.conns = new Map()
    this.awareness = new awarenessProtocol.Awareness(this)
    this.awareness.setLocalState(null)
    this.awareness.on('update', ({ added, updated, removed }, conn) => {
      const changedClients = added.concat(updated, removed)
      if (conn) {
        const ids = this.conns.get(conn)
        if (ids) {
          added.forEach(id => ids.add(id))
          removed.forEach(id => ids.delete(id))
        }
      }
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, messageAwareness)
      encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients))
      const buff = encoding.toUint8Array(encoder)
      this.conns.forEach((_, c) => send(this, c, buff))
    })
    this.on('update', updateHandler)
  }
}

const getYDoc = (docname) => map.setIfUndefined(docs, docname, () => {
  const doc = new WSSharedDoc(docname)
  if (persistence) persistence.bindState(docname, doc)
  docs.set(docname, doc)
  return doc
})

const messageListener = (conn, doc, message) => {
  try {
    const encoder = encoding.createEncoder()
    const decoder = decoding.createDecoder(message)
    const messageType = decoding.readVarUint(decoder)
    switch (messageType) {
      case messageSync: {
        encoding.writeVarUint(encoder, messageSync)
        syncProtocol.readSyncMessage(decoder, encoder, doc, conn)
        if (encoding.length(encoder) > 1) send(doc, conn, encoding.toUint8Array(encoder))
        break
      }
      case messageAwareness: {
        awarenessProtocol.applyAwarenessUpdate(doc.awareness, decoding.readVarUint8Array(decoder), conn)
        break
      }
    }
  } catch (err) {
    console.error(err)
    doc.emit('error', [err])
  }
}

const closeConn = (doc, conn) => {
  if (doc.conns.has(conn)) {
    const controlledIds = doc.conns.get(conn)
    doc.conns.delete(conn)
    awarenessProtocol.removeAwarenessStates(doc.awareness, Array.from(controlledIds), null)
    if (doc.conns.size === 0 && persistence) {
      persistence.writeState(doc.name, doc).then(() => { doc.destroy() })
      docs.delete(doc.name)
    }
  }
  conn.close()
}

const send = (doc, conn, m) => {
  if (conn.readyState !== 0 && conn.readyState !== 1) { closeConn(doc, conn); return }
  try { conn.send(m, {}, err => { if (err) closeConn(doc, conn) }) } catch (e) { closeConn(doc, conn) }
}

const setupWSConnection = (conn, req, opts = {}) => {
  const docName = (opts.docName || req.url || '').slice(1).split('?')[0]
  if (!docName) { conn.close(); return }
  conn.binaryType = 'arraybuffer'
  const doc = getYDoc(docName)
  doc.conns.set(conn, new Set())

  conn.on('message', (message) => messageListener(conn, doc, new Uint8Array(message)))

  let pongReceived = true
  const pingInterval = setInterval(() => {
    if (!pongReceived) { if (doc.conns.has(conn)) closeConn(doc, conn); clearInterval(pingInterval) }
    else if (doc.conns.has(conn)) { pongReceived = false; try { conn.ping() } catch (e) { closeConn(doc, conn); clearInterval(pingInterval) } }
  }, pingTimeout)
  conn.on('close', () => { closeConn(doc, conn); clearInterval(pingInterval) })
  conn.on('pong', () => { pongReceived = true })

  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, messageSync)
  syncProtocol.writeSyncStep1(encoder, doc)
  send(doc, conn, encoding.toUint8Array(encoder))

  const states = doc.awareness.getStates()
  if (states.size > 0) {
    const encoder2 = encoding.createEncoder()
    encoding.writeVarUint(encoder2, messageAwareness)
    encoding.writeVarUint8Array(encoder2, awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(states.keys())))
    send(doc, conn, encoding.toUint8Array(encoder2))
  }
}

// ---- HTTP + WebSocket ----

const host = process.env.HOST || '0.0.0.0'
const port = parseInt(process.env.PORT || '1234')

const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('ok')
})

const wss = new WebSocketServer({ noServer: true })
wss.on('connection', setupWSConnection)

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req)
  })
})

server.listen(port, host, () => {
  console.log(`yjs-server running on ${host}:${port}`)
})
