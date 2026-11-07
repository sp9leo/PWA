# TODO / Future Ideas

- [ ] **Server persistence** — enable `setPersistence(ldb)` on yjs-server so state survives restarts (currently memory-only)
- [ ] **Change log / audit trail** — server-side log tracking unit changes (status, location, leader, vehicles) with who/when/what
- [ ] **Unit history view** — per-unit timeline showing status changes, notes, leader changes, etc.
- [x] **Data backup & export** — export all units/activities/admin data as JSON; import to restore (done: Admin view has Export JSON + Import JSON buttons)
- [ ] **Read-only kanban for external users** — shareable URL showing kanban state without edit capabilities (no drag, no add/edit/delete)
- [ ] **ETA for arriving units** — input field for estimated time of arrival per unit, ETA countdown/overdue indicator on kanban cards
- [ ] **Unit-mode exit mechanism** — way for unit devices to leave unit mode (e.g. re-enter admin PIN, QR code scan, or remote unlock from admin view)
- [ ] **Fix arriving view, unit dispatch flow and unit live view** — refine PIN login, dispatch from predefined unit, and real-time tracking card for dispatched units
- [x] **Crew and unit counters** — live totals for crew and units across statuses/locations (done: counters strip in header with per-status crew counts)
- [ ] **Dashboard with statistics** — summary view with unit counts by status, crew totals, location breakdown
- [ ] **Bulk change status and location** — select multiple units and update status/location in one action
- [ ] **Offline work & sync** — work offline on local PC, sync changes to server when connection is available
