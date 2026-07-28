import type { Item } from '../types/item'

interface ItemStorageDocument {
  version: 1
  items: Item[]
}

const STORAGE_KEY = 'homestock:items'
const STORAGE_VERSION = 1

function cloneItems(items: Item[]): Item[] {
  return JSON.parse(JSON.stringify(items)) as Item[]
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
    item.quantity > 0 &&
    typeof item.unit === 'string' &&
    typeof item.memo === 'string' &&
    typeof item.createdAt === 'string' &&
    typeof item.updatedAt === 'string'
  )
}

export class ItemRepository {
  private items: Item[] = []

  getAllItems(): Item[] {
    return cloneItems(this.items)
  }

  getItemsByZone(zoneId: string): Item[] {
    return cloneItems(this.items.filter((item) => item.zoneId === zoneId))
  }

  getItem(id: string): Item | undefined {
    const item = this.items.find((current) => current.id === id)
    return item ? cloneItems([item])[0] : undefined
  }

  addItem(item: Item): Item {
    if (this.items.some((current) => current.id === item.id)) {
      throw new Error(`Item already exists: ${item.id}`)
    }
    this.items = [...this.items, cloneItems([item])[0]]
    this.save()
    return cloneItems([item])[0]
  }

  updateItem(item: Item): Item {
    if (!this.items.some((current) => current.id === item.id)) {
      throw new Error(`Item not found: ${item.id}`)
    }
    this.items = this.items.map((current) => current.id === item.id ? cloneItems([item])[0] : current)
    this.save()
    return cloneItems([item])[0]
  }

  removeItem(id: string): void {
    this.items = this.items.filter((item) => item.id !== id)
    this.save()
  }

  save(): void {
    const document: ItemStorageDocument = { version: STORAGE_VERSION, items: this.items }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(document))
    } catch {
      // Keep the in-memory collection usable if browser storage is unavailable.
    }
  }

  load(): Item[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        this.items = []
        this.save()
        return []
      }
      const parsed = JSON.parse(raw) as Partial<ItemStorageDocument>
      if (
        parsed.version !== STORAGE_VERSION ||
        !Array.isArray(parsed.items) ||
        !parsed.items.every(isItem)
      ) throw new Error('Invalid Item storage')
      this.items = cloneItems(parsed.items)
      return this.getAllItems()
    } catch {
      this.items = []
      this.save()
      return []
    }
  }
}

export const itemRepository = new ItemRepository()
