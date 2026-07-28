import type { Item, ItemChange } from '../types/item'

interface ItemStorageDocument {
  version: 2
  items: Item[]
  changes: ItemChange[]
}

const STORAGE_KEY = 'homestock:items'
const STORAGE_VERSION = 2

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function isItem(value: unknown): value is Item {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.zoneId === 'string' &&
    typeof item.name === 'string' &&
    typeof item.quantity === 'number' &&
    Number.isFinite(item.quantity) &&
    item.quantity >= 0 &&
    typeof item.unit === 'string' &&
    typeof item.memo === 'string' &&
    typeof item.createdAt === 'string' &&
    typeof item.updatedAt === 'string'
  )
}

function isChange(value: unknown): value is ItemChange {
  if (typeof value !== 'object' || value === null) return false
  const change = value as Record<string, unknown>
  const validTypes = new Set([
    'itemCreated',
    'itemQuantityIncreased',
    'itemQuantityDecreased',
    'itemEdited',
    'itemDeleted'
  ])
  return (
    typeof change.id === 'string' &&
    typeof change.zoneId === 'string' &&
    typeof change.itemName === 'string' &&
    typeof change.type === 'string' &&
    validTypes.has(change.type) &&
    typeof change.message === 'string' &&
    typeof change.createdAt === 'string'
  )
}

function migrateItem(value: unknown): Item | null {
  if (typeof value !== 'object' || value === null) return null
  const item = value as Record<string, unknown>
  if (
    typeof item.id !== 'string' ||
    typeof item.zoneId !== 'string' ||
    typeof item.name !== 'string' ||
    typeof item.quantity !== 'number' ||
    !Number.isFinite(item.quantity)
  ) return null
  const createdAt = typeof item.createdAt === 'string'
    ? item.createdAt
    : new Date().toISOString()
  return {
    id: item.id,
    zoneId: item.zoneId,
    name: item.name.trim() || '이름 없는 물품',
    quantity: Math.max(0, item.quantity),
    unit: typeof item.unit === 'string' && item.unit ? item.unit : '개',
    memo: typeof item.memo === 'string' ? item.memo : '',
    createdAt,
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : createdAt
  }
}

export class ItemRepository {
  private items: Item[] = []
  private changes: ItemChange[] = []

  getAllItems(): Item[] {
    return clone(this.items)
  }

  getItemsByZone(zoneId: string): Item[] {
    return clone(this.items.filter((item) => item.zoneId === zoneId))
  }

  getItem(id: string): Item | undefined {
    const item = this.items.find((current) => current.id === id)
    return item ? clone(item) : undefined
  }

  getChangesByZone(zoneId: string): ItemChange[] {
    return clone(this.changes.filter((change) => change.zoneId === zoneId))
  }

  getLatestChangeByZone(zoneId: string): ItemChange | undefined {
    return this.getChangesByZone(zoneId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  }

  addItem(item: Item): Item {
    if (this.items.some((current) => current.id === item.id)) {
      throw new Error(`Item already exists: ${item.id}`)
    }
    this.items = [...this.items, clone(item)]
    this.save()
    return clone(item)
  }

  updateItem(item: Item): Item {
    if (!this.items.some((current) => current.id === item.id)) {
      throw new Error(`Item not found: ${item.id}`)
    }
    this.items = this.items.map((current) => current.id === item.id ? clone(item) : current)
    this.save()
    return clone(item)
  }

  removeItem(id: string): void {
    this.items = this.items.filter((item) => item.id !== id)
    this.save()
  }

  addChange(change: ItemChange): void {
    this.changes = [...this.changes, clone(change)].slice(-500)
    this.save()
  }

  save(): void {
    const document: ItemStorageDocument = {
      version: STORAGE_VERSION,
      items: this.items,
      changes: this.changes
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(document))
    } catch {
      // Storage failures must not make the current UI unusable.
    }
  }

  load(): Item[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        this.items = []
        this.changes = []
        this.save()
        return []
      }
      const parsed = JSON.parse(raw) as {
        version?: number
        items?: unknown[]
        changes?: unknown[]
      }
      if (!Array.isArray(parsed.items)) {
        throw new Error('Invalid Item storage')
      }
      const migratedItems = parsed.items.map(migrateItem).filter((item): item is Item => item !== null)
      this.items = clone(migratedItems.filter(isItem))
      this.changes = parsed.version === 2 && Array.isArray(parsed.changes)
        ? clone(parsed.changes.filter(isChange))
        : []
      this.save()
      return this.getAllItems()
    } catch {
      this.items = []
      this.changes = []
      this.save()
      return []
    }
  }
}

export const itemRepository = new ItemRepository()
