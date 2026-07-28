import type { Zone } from '../types/zone'
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
