import type { Space } from '../../types/space'

export const spaces: Space[] = [
  { id: 'entry', name: '현관', color: '#E5E1DD', path: 'M377 39 H474 Q486 39 486 51 V145 H377 Z' },
  { id: 'storage', name: '수납실', color: '#F4E4BB', path: 'M86 39 H207 V119 H86 Q74 119 74 107 V51 Q74 39 86 39 Z' },
  { id: 'bathroom', name: '욕실', color: '#CFE0ED', path: 'M74 123 H207 V208 H74 Z' },
  { id: 'bedroom', name: '침실', color: '#DED3E5', path: 'M211 39 H373 V208 H211 Z' },
  { id: 'hallway', name: '복도', color: '#F3DFA8', path: 'M74 212 H486 V420 H335 V530 H216 V420 H74 Z' },
  { id: 'study', name: '서재', color: '#CFE6D3', path: 'M74 424 H212 V585 H86 Q74 585 74 573 Z' },
  { id: 'living', name: '거실', color: '#D7EAD8', path: 'M216 424 H335 V573 Q335 585 323 585 H216 Z' },
  { id: 'utility', name: '세탁실', color: '#F0E2CF', path: 'M339 424 H414 V530 H339 Z' },
  { id: 'pantry', name: '팬트리', color: '#E4E1DE', path: 'M418 424 H486 V518 Q486 530 474 530 H418 Z' },
  { id: 'kitchen', name: '주방', color: '#F6E6B9', path: 'M377 149 H486 V408 Q486 420 474 420 H339 V212 H377 Z' }
]
