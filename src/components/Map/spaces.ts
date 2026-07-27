import type { Point, Space } from '../../types/space'

const CORNER_RADIUS = 8

const rectangle = (left: number, top: number, right: number, bottom: number): Point[] => [
  { x: left, y: top },
  { x: right, y: top },
  { x: right, y: bottom },
  { x: left, y: bottom }
]

const space = (
  id: string,
  name: string,
  color: string,
  points: Point[]
): Space => ({
  id,
  name,
  color,
  geometry: {
    type: 'polygon',
    points,
    cornerRadius: CORNER_RADIUS
  }
})

/*
 * All coordinates use the same four-unit gutter. Each room owns its polygon,
 * so future editing operations can transform, split, merge, add, or remove
 * rooms without parsing presentation-specific SVG path strings.
 */
export const spaces: Space[] = [
  space('entry', '현관', '#E5E1DD', rectangle(377, 39, 486, 145)),
  space('storage', '수납실', '#F4E4BB', rectangle(74, 39, 207, 119)),
  space('bathroom', '욕실', '#CFE0ED', rectangle(74, 123, 207, 208)),
  space('bedroom', '침실', '#DED3E5', rectangle(211, 39, 373, 208)),
  space('hallway', '복도', '#F3DFA8', rectangle(74, 212, 486, 420)),
  space('study', '서재', '#CFE6D3', rectangle(74, 424, 212, 585)),
  space('living', '거실', '#D7EAD8', rectangle(216, 424, 335, 585)),
  space('utility', '세탁실', '#F0E2CF', rectangle(339, 424, 414, 530)),
  space('pantry', '팬트리', '#E4E1DE', rectangle(418, 424, 486, 530)),
  space('kitchen', '주방', '#F6E6B9', rectangle(377, 149, 486, 208))
]
