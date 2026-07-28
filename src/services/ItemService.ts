import { itemRepository, type ItemRepository } from '../repositories/ItemRepository'
import type { CreateItemInput, Item, ItemChangeType, UpdateItemInput } from '../types/item'
import { zoneService, type ZoneService } from './ZoneService'

export const ITEM_NAME_MAX_LENGTH = 30
export const ITEM_MEMO_MAX_LENGTH = 100
export const ITEM_UNITS = ['개', '팩', '병', '봉', '박스', 'kg', 'g', 'L', 'mL'] as const

function createId(prefix: string) {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function formatQuantity(quantity: number) {
  return Number.isInteger(quantity) ? String(quantity) : String(Number(quantity.toFixed(2)))
}

export class ItemService {
  constructor(
    private readonly repository: ItemRepository,
    private readonly zones: ZoneService
  ) {}

  createItem(input: CreateItemInput): Item {
    const name = this.normalizeName(input.name)
    const quantity = this.normalizeQuantity(input.quantity, false)
    const unit = this.normalizeUnit(input.unit ?? '개')
    const memo = this.normalizeMemo(input.memo ?? '')
    const timestamp = new Date().toISOString()
    const item: Item = {
      id: createId('item'),
      zoneId: input.zoneId,
      name,
      quantity,
      unit,
      memo,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    this.repository.addItem(item)
    try {
      this.zones.assignItem(input.zoneId, item.id)
      this.record(item, 'itemCreated', `${name} ${formatQuantity(quantity)}${unit} 추가`)
    } catch (error) {
      this.repository.removeItem(item.id)
      throw error
    }
    return item
  }

  updateItem(id: string, changes: UpdateItemInput): Item {
    const current = this.requireItem(id)
    const next = this.persist(current, {
      name: changes.name === undefined ? current.name : this.normalizeName(changes.name),
      quantity: changes.quantity === undefined
        ? current.quantity
        : this.normalizeQuantity(changes.quantity, true),
      unit: changes.unit === undefined ? current.unit : this.normalizeUnit(changes.unit),
      memo: changes.memo === undefined ? current.memo : this.normalizeMemo(changes.memo)
    })
    const onlyQuantityChanged =
      next.quantity !== current.quantity &&
      next.name === current.name &&
      next.unit === current.unit &&
      next.memo === current.memo
    this.record(
      next,
      'itemEdited',
      onlyQuantityChanged
        ? `${next.name} 수량 ${formatQuantity(next.quantity)}${next.unit}로 변경`
        : `${next.name} 수정`
    )
    return next
  }

  updateQuantity(id: string, quantity: number): Item {
    const item = this.requireItem(id)
    return this.persist(item, { quantity: this.normalizeQuantity(quantity, true) })
  }

  incrementQuantity(id: string, amount = 1): Item {
    const item = this.requireItem(id)
    const next = this.persist(item, { quantity: item.quantity + Math.abs(amount) })
    this.record(next, 'itemQuantityIncreased', `${next.name} ${formatQuantity(Math.abs(amount))}${next.unit} 추가`)
    return next
  }

  decrementQuantity(id: string, amount = 1): Item {
    const item = this.requireItem(id)
    const reducedBy = Math.min(item.quantity, Math.abs(amount))
    const next = this.persist(item, { quantity: Math.max(0, item.quantity - Math.abs(amount)) })
    if (reducedBy > 0) {
      this.record(next, 'itemQuantityDecreased', `${next.name} ${formatQuantity(reducedBy)}${next.unit} 사용`)
    }
    return next
  }

  renameItem(id: string, name: string): Item {
    return this.updateItem(id, { name })
  }

  updateMemo(id: string, memo: string): Item {
    return this.updateItem(id, { memo })
  }

  deleteItem(id: string): void {
    const item = this.repository.getItem(id)
    if (!item) return
    this.zones.removeItem(item.zoneId, id)
    this.repository.removeItem(id)
    this.record(item, 'itemDeleted', `${item.name} 삭제`)
  }

  private requireItem(id: string) {
    const item = this.repository.getItem(id)
    if (!item) throw new Error(`Item not found: ${id}`)
    return item
  }

  private persist(item: Item, changes: UpdateItemInput) {
    return this.repository.updateItem({
      ...item,
      ...changes,
      updatedAt: new Date().toISOString()
    })
  }

  private record(item: Item, type: ItemChangeType, message: string) {
    this.repository.addChange({
      id: createId('change'),
      zoneId: item.zoneId,
      itemId: type === 'itemDeleted' ? undefined : item.id,
      itemName: item.name,
      type,
      message,
      createdAt: new Date().toISOString()
    })
  }

  private normalizeName(value: string) {
    const normalized = value.trim()
    if (!normalized || normalized.length > ITEM_NAME_MAX_LENGTH) throw new Error('Invalid Item name')
    return normalized
  }

  private normalizeQuantity(value: number, allowZero: boolean) {
    if (!Number.isFinite(value) || value < 0 || (!allowZero && value === 0)) {
      throw new Error('Invalid quantity')
    }
    return value
  }

  private normalizeUnit(value: string) {
    if (!ITEM_UNITS.includes(value as (typeof ITEM_UNITS)[number])) throw new Error('Invalid unit')
    return value
  }

  private normalizeMemo(value: string) {
    const normalized = value.trim()
    if (normalized.length > ITEM_MEMO_MAX_LENGTH) throw new Error('Memo is too long')
    return normalized
  }
}

export const itemService = new ItemService(itemRepository, zoneService)
