/**
 * Helpers for units that can carry several vehicles.
 *
 * New units store `vehicles: [{ id, type, crew, callSign }]`.
 * Older units only have `type` + `personnelCount`; they are treated as a
 * single-vehicle unit so no migration is required.
 */

export function normalizeVehicles(entity) {
  const raw = Array.isArray(entity?.vehicles) ? entity.vehicles : []
  const list = raw
    .filter(v => v && typeof v === 'object')
    .map(v => ({
      id: v.id || '',
      type: String(v.type || '').trim(),
      crew: Number(v.crew) || 0,
      callSign: String(v.callSign || '').trim(),
    }))

  if (list.length) return list

  // Legacy single-vehicle shape
  if (entity && (entity.type || entity.personnelCount)) {
    return [{
      id: '',
      type: entity.type || '',
      crew: Number(entity.personnelCount) || 0,
      callSign: '',
    }]
  }

  return []
}

export function totalCrew(entity) {
  return normalizeVehicles(entity).reduce((sum, v) => sum + v.crew, 0)
}

/** Group duplicate vehicle types, e.g. two GVC-1 -> [{ type: 'GVC-1', count: 2 }] */
export function vehicleTypeGroups(entity) {
  const counts = new Map()
  for (const v of normalizeVehicles(entity)) {
    if (!v.type) continue
    counts.set(v.type, (counts.get(v.type) || 0) + 1)
  }
  return [...counts.entries()].map(([type, count]) => ({ type, count }))
}

/** Compact summary for tables, e.g. "GVGP-1, 2× GVC-1" */
export function typeSummary(entity) {
  return vehicleTypeGroups(entity)
    .map(g => (g.count > 1 ? `${g.count}× ${g.type}` : g.type))
    .join(', ')
}

/** Lowercase text covering every vehicle field, for search filters. */
export function vehicleSearchText(entity) {
  return normalizeVehicles(entity)
    .flatMap(v => [v.type, v.callSign, v.crew])
    .filter(v => v !== '' && v !== null && v !== undefined)
    .join(' ')
    .toLowerCase()
}
