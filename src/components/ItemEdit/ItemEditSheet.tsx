import { useState, type PointerEvent, type SyntheticEvent } from 'react'
import {
  ITEM_MEMO_MAX_LENGTH,
  ITEM_NAME_MAX_LENGTH,
  ITEM_UNITS
} from '../../services/ItemService'
import type { Item, UpdateItemInput } from '../../types/item'
import './ItemEditSheet.css'

interface ItemEditSheetProps {
  item: Item
  onCancel: () => void
  onDelete: () => void
  onSave: (changes: UpdateItemInput) => void
}

export function ItemEditSheet({ item, onCancel, onDelete, onSave }: ItemEditSheetProps) {
  const [name, setName] = useState(item.name)
  const [quantity, setQuantity] = useState(String(item.quantity))
  const [unit, setUnit] = useState(item.unit)
  const [memo, setMemo] = useState(item.memo)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const numericQuantity = Number(quantity)
  const canSave =
    name.trim().length > 0 &&
    Number.isFinite(numericQuantity) &&
    numericQuantity >= 0
  const stopPropagation = (event: SyntheticEvent | PointerEvent) => event.stopPropagation()

  return (
    <aside
      aria-label="물품 편집"
      className="item-edit-sheet"
      onClick={stopPropagation}
      onPointerDown={stopPropagation}
      onPointerMove={stopPropagation}
      onPointerUp={stopPropagation}
    >
      <div className="edit-handle" aria-hidden="true" />
      <h2>물품 편집</h2>
      <div className="item-edit-fields">
        <label>
          <span>물품 이름</span>
          <input
            autoFocus
            maxLength={ITEM_NAME_MAX_LENGTH}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <div className="item-edit-quantity">
          <label>
            <span>수량</span>
            <input
              inputMode="decimal"
              min="0"
              step="any"
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>
          <label>
            <span>단위</span>
            <select value={unit} onChange={(event) => setUnit(event.target.value)}>
              {ITEM_UNITS.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
        </div>
        <label>
          <span>메모 <small>선택</small></span>
          <textarea
            maxLength={ITEM_MEMO_MAX_LENGTH}
            rows={2}
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
          />
        </label>
      </div>
      {confirmingDelete ? (
        <div className="delete-confirm" role="alert">
          <p>‘{item.name}’을 삭제할까요?</p>
          <button type="button" onClick={() => setConfirmingDelete(false)}>취소</button>
          <button type="button" className="danger-filled" onClick={onDelete}>삭제</button>
        </div>
      ) : (
        <>
          <div className="item-edit-actions">
            <button type="button" onClick={onCancel}>취소</button>
            <button
              type="button"
              className="primary"
              disabled={!canSave}
              onClick={() => onSave({ name, quantity: numericQuantity, unit, memo })}
            >
              저장
            </button>
          </div>
          <button type="button" className="delete-button" onClick={() => setConfirmingDelete(true)}>
            물품 삭제
          </button>
        </>
      )}
    </aside>
  )
}
