import type { Point, Zone } from '../types/zone'
import { zoneRepository, type ZoneRepository } from '../repositories/ZoneRepository'

export const MAX_ZONE_NAME_LENGTH = 24

export class ZoneService {
  constructor(private readonly repository: ZoneRepository) {}

  renameZone(id: string, name: string): Zone {
    const normalizedName = name.trim()
    if (!normalizedName) throw new Error('Zone name cannot be empty')
    if (normalizedName.length > MAX_ZONE_NAME_LENGTH) {
      throw new Error(`Zone name cannot exceed ${MAX_ZONE_NAME_LENGTH} characters`)
    }
    return this.update(id, { name: normalizedName })
  }

  changeColor(id: string, color: string): Zone {
    if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error('Invalid Zone color')
    return this.update(id, { color })
  }

  toggleVisible(id: string): Zone {
    const zone = this.requireZone(id)
    return this.update(id, { visible: !zone.visible })
  }

  lock(id: string): Zone {
    return this.update(id, { locked: true })
  }

  unlock(id: string): Zone {
    return this.update(id, { locked: false })
  }

  assignItem(id: string, itemId: string): Zone {
    const zone = this.requireZone(id)
    if (zone.items.includes(itemId)) return zone
    return this.update(id, { items: [...zone.items, itemId] })
  }

  removeItem(id: string, itemId: string): Zone {
    const zone = this.requireZone(id)
    return this.update(id, { items: zone.items.filter((currentId) => currentId !== itemId) })
  }

  updatePolygon(id: string, points: Point[]): Zone {
    if (points.length !== 4 || points.some(({ x, y }) => !Number.isFinite(x) || !Number.isFinite(y))) {
      throw new Error('Only valid rectangular polygons are supported')
    }
    const zone = this.requireZone(id)
    return this.update(id, {
      polygon: {
        ...zone.polygon,
        points
      }
    })
  }

  createZone(points: Point[]): Zone {
    const timestamp = new Date().toISOString()
    const id = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `zone-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const zone: Zone = {
      id,
      name: '새 공간',
      color: '#E5E1DD',
      polygon: { type: 'polygon', points, cornerRadius: 8 },
      visible: true,
      locked: false,
      items: [],
      children: [],
      metadata: {
        source: 'user',
        createdAt: timestamp,
        updatedAt: timestamp
      },
      createdAt: timestamp,
      updatedAt: timestamp
    }
    return this.repository.addZone(zone)
  }

  deleteZone(id: string): void {
    const zone = this.requireZone(id)
    if (zone.items.length > 0) throw new Error('ZONE_HAS_ITEMS')
    this.repository.removeZone(id)
  }

  private requireZone(id: string): Zone {
    const zone = this.repository.getZone(id)
    if (!zone) throw new Error(`Zone not found: ${id}`)
    return zone
  }

  private update(id: string, changes: Partial<Zone>): Zone {
    const zone = this.requireZone(id)
    const updatedAt = new Date().toISOString()
    return this.repository.updateZone({
      ...zone,
      ...changes,
      id: zone.id,
      createdAt: zone.createdAt,
      updatedAt,
      metadata: {
        ...zone.metadata,
        updatedAt
      }
    })
  }
}

export const zoneService = new ZoneService(zoneRepository)
