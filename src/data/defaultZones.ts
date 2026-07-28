import type { Point, Zone } from '../types/zone'

const CORNER_RADIUS = 8

const rectangle = (left: number, top: number, right: number, bottom: number): Point[] => [
  { x: left, y: top },
  { x: right, y: top },
  { x: right, y: bottom },
  { x: left, y: bottom }
]

const createZone = (
  id: string,
  name: string,
  color: string,
  points: Point[],
  timestamp: string
): Zone => ({
  id,
  name,
  color,
  polygon: {
    type: 'polygon',
    points,
    cornerRadius: CORNER_RADIUS
  },
  visible: true,
  locked: false,
  items: [],
  children: [],
  metadata: {
    source: 'default',
    createdAt: timestamp,
    updatedAt: timestamp
  },
  createdAt: timestamp,
  updatedAt: timestamp
})

export function createDefaultZones(timestamp = new Date().toISOString()): Zone[] {
  return [
    createZone('entry', '현관', '#E5E1DD', rectangle(377, 39, 486, 145), timestamp),
    createZone('storage', '수납실', '#F4E4BB', rectangle(74, 39, 207, 119), timestamp),
    createZone('bathroom', '욕실', '#CFE0ED', rectangle(74, 123, 207, 208), timestamp),
    createZone('bedroom', '침실', '#DED3E5', rectangle(211, 39, 373, 208), timestamp),
    createZone('hallway', '복도', '#F3DFA8', rectangle(74, 212, 486, 420), timestamp),
    createZone('study', '서재', '#CFE6D3', rectangle(74, 424, 212, 585), timestamp),
    createZone('living', '거실', '#D7EAD8', rectangle(216, 424, 335, 585), timestamp),
    createZone('utility', '세탁실', '#F0E2CF', rectangle(339, 424, 414, 530), timestamp),
    createZone('pantry', '팬트리', '#E4E1DE', rectangle(418, 424, 486, 530), timestamp),
    createZone('kitchen', '주방', '#F6E6B9', rectangle(377, 149, 486, 208), timestamp)
  ]
}
