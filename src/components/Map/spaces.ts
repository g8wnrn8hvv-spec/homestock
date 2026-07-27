import type { Space } from '../../types/space'

export const spaces: Space[] = [
  {
    id: 'entry',
    name: '현관',
    color: '#E5E1DD',
    path: 'M385 39 H478 Q486 39 486 47 V137 Q486 145 478 145 H377 V47 Q377 39 385 39 Z'
  },
  {
    id: 'storage',
    name: '수납실',
    color: '#F4E4BB',
    path: 'M82 39 H199 Q207 39 207 47 V111 Q207 119 199 119 H82 Q74 119 74 111 V47 Q74 39 82 39 Z'
  },
  {
    id: 'bathroom',
    name: '욕실',
    color: '#CFE0ED',
    path: 'M82 123 H199 Q207 123 207 131 V200 Q207 208 199 208 H82 Q74 208 74 200 V131 Q74 123 82 123 Z'
  },
  {
    id: 'bedroom',
    name: '침실',
    color: '#DED3E5',
    path: 'M219 39 H365 Q373 39 373 47 V200 Q373 208 365 208 H219 Q211 208 211 200 V47 Q211 39 219 39 Z'
  },
  {
    id: 'hallway',
    name: '복도',
    color: '#F3DFA8',
    path: 'M82 212 H478 Q486 212 486 220 V412 Q486 420 478 420 H347 Q339 420 339 428 V522 Q339 530 331 530 H224 Q216 530 216 522 V428 Q216 420 208 420 H82 Q74 420 74 412 V220 Q74 212 82 212 Z'
  },
  {
    id: 'study',
    name: '서재',
    color: '#CFE6D3',
    path: 'M82 424 H204 Q212 424 212 432 V577 Q212 585 204 585 H82 Q74 585 74 577 V432 Q74 424 82 424 Z'
  },
  {
    id: 'living',
    name: '거실',
    color: '#D7EAD8',
    path: 'M224 424 H327 Q335 424 335 432 V577 Q335 585 327 585 H224 Q216 585 216 577 V432 Q216 424 224 424 Z'
  },
  {
    id: 'utility',
    name: '세탁실',
    color: '#F0E2CF',
    path: 'M347 424 H406 Q414 424 414 432 V522 Q414 530 406 530 H347 Q339 530 339 522 V432 Q339 424 347 424 Z'
  },
  {
    id: 'pantry',
    name: '팬트리',
    color: '#E4E1DE',
    path: 'M426 424 H478 Q486 424 486 432 V522 Q486 530 478 530 H426 Q418 530 418 522 V432 Q418 424 426 424 Z'
  },
  {
    id: 'kitchen',
    name: '주방',
    color: '#F6E6B9',
    path: 'M385 149 H478 Q486 149 486 157 V200 Q486 208 478 208 H385 Q377 208 377 200 V157 Q377 149 385 149 Z'
  }
]
