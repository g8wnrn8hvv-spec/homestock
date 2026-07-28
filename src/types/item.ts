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
