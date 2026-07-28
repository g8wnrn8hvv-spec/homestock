import { createDefaultZones } from '../data/defaultZones'
import type { Point, Zone, ZoneMetadata, ZonePolygon, ZoneSource } from '../types/zone'

interface ZoneStorageDocument {
  version: 1
  zones: Zone[]
}

interface LegacyZone {
  id?: unknown
  name?: unknown
  color?: unknown
  polygon?: unknown
  geometry?: unknown
  visible?: unknown
  locked?: unknown
  items?: unknown
  children?: unknown
  metadata?: unknown
  createdAt?: unknown
  updatedAt?: unknown
}

const STORAGE_KEY = 'homestock:zones'
const LEGACY_STORAGE_KEYS = ['homestock:spaces', 'homestock:map-spaces']
const STORAGE_VERSION = 1
const VALID_SOURCES = new Set<ZoneSource>(['default', 'user', 'ai', 'migration'])

function cloneZones(zones: Zone[]): Zone[] {
  return JSON.parse(JSON.stringify(zones)) as Zone[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function migratePoint(value: unknown): Point | null {
  if (!isRecord(value) || !Number.isFinite(value.x) || !Number.isFinite(value.y)) return null
  return { x: value.x as number, y: value.y as number }
}

function migratePolygon(value: unknown): ZonePolygon | null {
  if (!isRecord(value) || !Array.isArray(value.points)) return null
  const points = value.points.map(migratePoint)
  if (points.length < 3 || points.some((point) => point === null)) return null
  const cornerRadius = Number.isFinite(value.cornerRadius)
    ? Math.max(0, value.cornerRadius as number)
    : 8
  return {
    type: 'polygon',
    points: points as Point[],
    cornerRadius
  }
}

function migrateZone(value: unknown, timestamp: string): Zone | null {
  if (!isRecord(value)) return null
  const legacy = value as LegacyZone
  if (
    typeof legacy.id !== 'string' ||
    typeof legacy.name !== 'string' ||
    typeof legacy.color !== 'string'
  ) return null

  const polygon = migratePolygon(legacy.polygon) ?? migratePolygon(legacy.geometry)
  if (!polygon) return null

  const createdAt = isTimestamp(legacy.createdAt) ? legacy.createdAt : timestamp
  const updatedAt = isTimestamp(legacy.updatedAt) ? legacy.updatedAt : createdAt
  const rawMetadata = isRecord(legacy.metadata) ? legacy.metadata : {}
  const source = VALID_SOURCES.has(rawMetadata.source as ZoneSource)
    ? rawMetadata.source as ZoneSource
    : 'migration'
  const childValues = Array.isArray(legacy.children) ? legacy.children : []
  const children = childValues.map((child) => migrateZone(child, timestamp))
  if (children.some((child) => child === null)) return null

  const metadata: ZoneMetadata = {
    ...rawMetadata,
    source,
    createdAt: isTimestamp(rawMetadata.createdAt) ? rawMetadata.createdAt : createdAt,
    updatedAt: isTimestamp(rawMetadata.updatedAt) ? rawMetadata.updatedAt : updatedAt
  }

  return {
    id: legacy.id,
    name: legacy.name,
    color: legacy.color,
    polygon,
    visible: typeof legacy.visible === 'boolean' ? legacy.visible : true,
    locked: typeof legacy.locked === 'boolean' ? legacy.locked : false,
    items: Array.isArray(legacy.items)
      ? legacy.items.filter((item): item is string => typeof item === 'string')
      : [],
    children: children as Zone[],
    metadata,
    createdAt,
    updatedAt
  }
}

function migrateZones(value: unknown): Zone[] | null {
  if (!Array.isArray(value) || value.length === 0) return null
  const timestamp = new Date().toISOString()
  const zones = value.map((zone) => migrateZone(zone, timestamp))
  if (zones.some((zone) => zone === null)) return null
  return zones as Zone[]
}

function findZone(zones: Zone[], id: string): Zone | undefined {
  for (const zone of zones) {
    if (zone.id === id) return zone
    const child = findZone(zone.children, id)
    if (child) return child
  }
  return undefined
}

function replaceZone(zones: Zone[], updatedZone: Zone): Zone[] {
  return zones.map((zone) => {
    if (zone.id === updatedZone.id) return updatedZone
    return { ...zone, children: replaceZone(zone.children, updatedZone) }
  })
}

function removeZone(zones: Zone[], id: string): Zone[] {
  return zones
    .filter((zone) => zone.id !== id)
    .map((zone) => ({ ...zone, children: removeZone(zone.children, id) }))
}

export class ZoneRepository {
  private zones: Zone[] = []

  getAllZones(): Zone[] {
    return cloneZones(this.zones)
  }

  getZone(id: string): Zone | undefined {
    const zone = findZone(this.zones, id)
    return zone ? cloneZones([zone])[0] : undefined
  }

  updateZone(zone: Zone): Zone {
    if (!findZone(this.zones, zone.id)) {
      throw new Error(`Zone not found: ${zone.id}`)
    }
    this.zones = replaceZone(this.zones, cloneZones([zone])[0])
    this.save()
    return cloneZones([zone])[0]
  }

  addZone(zone: Zone): Zone {
    if (findZone(this.zones, zone.id)) throw new Error(`Zone already exists: ${zone.id}`)
    this.zones = [...this.zones, cloneZones([zone])[0]]
    this.save()
    return cloneZones([zone])[0]
  }

  removeZone(id: string): void {
    if (!findZone(this.zones, id)) return
    this.zones = removeZone(this.zones, id)
    this.save()
  }

  replaceZones(zones: Zone[]): Zone[] {
    const migrated = migrateZones(zones)
    if (!migrated) throw new Error('Invalid Zone collection')
    this.zones = migrated
    this.save()
    return this.getAllZones()
  }

  save(): void {
    const document: ZoneStorageDocument = {
      version: STORAGE_VERSION,
      zones: this.zones
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(document))
    } catch {
      // In-memory data remains usable when storage is unavailable.
    }
  }

  load(): Zone[] {
    try {
      const currentRaw = localStorage.getItem(STORAGE_KEY)
      if (currentRaw) {
        const parsed = JSON.parse(currentRaw) as unknown
        const rawZones = isRecord(parsed) && parsed.version === STORAGE_VERSION
          ? parsed.zones
          : parsed
        const migrated = migrateZones(rawZones)
        if (migrated) {
          this.zones = migrated
          this.save()
          return this.getAllZones()
        }
      }

      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        const legacyRaw = localStorage.getItem(legacyKey)
        if (!legacyRaw) continue
        const migrated = migrateZones(JSON.parse(legacyRaw) as unknown)
        if (migrated) {
          this.zones = migrated
          this.save()
          return this.getAllZones()
        }
      }
    } catch {
      // Corrupt or incompatible data falls through to a safe default document.
    }

    this.zones = createDefaultZones()
    this.save()
    return this.getAllZones()
  }
}

export const zoneRepository = new ZoneRepository()
