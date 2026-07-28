export interface Item {
  id: string
  zoneId: string
  name: string
  quantity: number
  unit: string
  memo: string
  createdAt: string
  updatedAt: string
}

export interface CreateItemInput {
  zoneId: string
  name: string
  quantity: number
  unit?: string
  memo?: string
}

export type ItemChangeType =
  | 'itemCreated'
  | 'itemQuantityIncreased'
  | 'itemQuantityDecreased'
  | 'itemEdited'
  | 'itemDeleted'

export interface ItemChange {
  id: string
  zoneId: string
  itemId?: string
  itemName: string
  type: ItemChangeType
  message: string
  createdAt: string
}

export interface UpdateItemInput {
  name?: string
  quantity?: number
  unit?: string
  memo?: string
}
