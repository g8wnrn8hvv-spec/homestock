export interface Point {
  x: number
  y: number
}

export interface ZonePolygon {
  type: 'polygon'
  points: Point[]
  cornerRadius: number
}

export type ZoneSource = 'default' | 'user' | 'ai' | 'migration'

export interface ZoneMetadata {
  source: ZoneSource
  createdAt: string
  updatedAt: string
  [key: string]: unknown
}

export interface Zone {
  id: string
  name: string
  color: string
  polygon: ZonePolygon
  visible: boolean
  locked: boolean
  items: string[]
  children: Zone[]
  metadata: ZoneMetadata
  createdAt: string
  updatedAt: string
}
