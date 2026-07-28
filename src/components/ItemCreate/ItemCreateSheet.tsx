import { useState, type PointerEvent, type SyntheticEvent } from 'react'
import {
  ITEM_MEMO_MAX_LENGTH,
  ITEM_NAME_MAX_LENGTH,
  ITEM_UNITS
} from '../../services/ItemService'
import type { CreateItemInput } from '../../types/item'
import type { Zone } from '../../types/zone'
import './ItemCreateSheet.css'

interface ItemCreateSheetProps {
  onCancel: () => void
  onSave: (input: CreateItemInput) => void
  zone: Zone
}

export function ItemCreateSheet({ onCancel, onSave, zone }: ItemCreateSheetProps) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('개')
  const [memo, setMemo] = useState('')
  const stopPropagation = (event: SyntheticEvent | PointerEvent) => event.stopPropagation()
  const numericQuantity = Number(quantity)
  const canSave = name.trim().length > 0 && Number.isFinite(numericQuantity) && numericQuantity > 0

  return (
    <aside
      aria-label="물품 추가"
      className="item-create-sheet"
      onClick={stopPropagation}
      onPointerDown={stopPropagation}
      onPointerMove={stopPropagation}
      onPointerUp={stopPropagation}
    >
      <div className="create-handle" aria-hidden="true" />
      <div className="create-heading">
        <span>{zone.name}</span>
        <h2>물품 추가</h2>
      </div>
      <label>
        <span>물품 이름</span>
        <input
          aria-label="물품 이름"
          autoFocus
          autoComplete="off"
          maxLength={ITEM_NAME_MAX_LENGTH}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <div className="quantity-row">
        <label>
          <span>수량</span>
          <input
            aria-label="수량"
            inputMode="decimal"
            min="0.01"
            step="any"
            type="number"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </label>
        <label>
          <span>단위</span>
          <select aria-label="단위" value={unit} onChange={(event) => setUnit(event.target.value)}>
            {ITEM_UNITS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <label>
        <span>메모 <small>선택</small></span>
        <textarea
          aria-label="메모"
          maxLength={ITEM_MEMO_MAX_LENGTH}
          rows={2}
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
        />
      </label>
      <div className="create-actions">
        <button type="button" onClick={onCancel}>취소</button>
        <button
          type="button"
          className="primary"
          disabled={!canSave}
          onClick={() => onSave({ zoneId: zone.id, name, quantity: numericQuantity, unit, memo })}
        >
          저장
        </button>
      </div>
    </aside>
  )
}
