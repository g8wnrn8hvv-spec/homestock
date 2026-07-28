import { itemRepository, type ItemRepository } from '../repositories/ItemRepository'
import type { CreateItemInput, Item } from '../types/item'
import { zoneService, type ZoneService } from './ZoneService'

export const ITEM_NAME_MAX_LENGTH = 30
export const ITEM_MEMO_MAX_LENGTH = 100
export const ITEM_UNITS = ['개', '팩', '병', '봉', '박스', 'kg', 'g', 'L', 'mL'] as const

function createId() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `item-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export class ItemService {
  constructor(
    private readonly repository: ItemRepository,
    private readonly zones: ZoneService
  ) {}

  createItem(input: CreateItemInput): Item {
    const name = input.name.trim()
    const memo = (input.memo ?? '').trim()
    const unit = input.unit ?? '개'
    if (!name || name.length > ITEM_NAME_MAX_LENGTH) throw new Error('Invalid Item name')
    if (!Number.isFinite(input.quantity) || input.quantity <= 0) throw new Error('Invalid quantity')
    if (!ITEM_UNITS.includes(unit as (typeof ITEM_UNITS)[number])) throw new Error('Invalid unit')
    if (memo.length > ITEM_MEMO_MAX_LENGTH) throw new Error('Memo is too long')

    const timestamp = new Date().toISOString()
    const item: Item = {
      id: createId(),
      zoneId: input.zoneId,
      name,
      quantity: input.quantity,
      unit,
      memo,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    this.repository.addItem(item)
    try {
      this.zones.assignItem(input.zoneId, item.id)
    } catch (error) {
      this.repository.removeItem(item.id)
      throw error
    }
    return item
  }

  updateQuantity(id: string, quantity: number): Item {
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Invalid quantity')
    return this.update(id, { quantity })
  }

  renameItem(id: string, name: string): Item {
    const normalized = name.trim()
    if (!normalized || normalized.length > ITEM_NAME_MAX_LENGTH) throw new Error('Invalid Item name')
    return this.update(id, { name: normalized })
  }

  updateMemo(id: string, memo: string): Item {
    const normalized = memo.trim()
    if (normalized.length > ITEM_MEMO_MAX_LENGTH) throw new Error('Memo is too long')
    return this.update(id, { memo: normalized })
  }

  deleteItem(id: string): void {
    const item = this.repository.getItem(id)
    if (!item) return
    this.repository.removeItem(id)
    this.zones.removeItem(item.zoneId, id)
  }

  private update(id: string, changes: Partial<Item>): Item {
    const item = this.repository.getItem(id)
    if (!item) throw new Error(`Item not found: ${id}`)
    return this.repository.updateItem({
      ...item,
      ...changes,
      id: item.id,
      zoneId: item.zoneId,
      createdAt: item.createdAt,
      updatedAt: new Date().toISOString()
    })
  }
}

export const itemService = new ItemService(itemRepository, zoneService)
