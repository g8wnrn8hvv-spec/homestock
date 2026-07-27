export interface Point {
  x: number
  y: number
}

export interface PolygonGeometry {
  type: 'polygon'
  points: Point[]
  cornerRadius: number
}

export interface Space {
  id: string
  name: string
  color: string
  geometry: PolygonGeometry
}
