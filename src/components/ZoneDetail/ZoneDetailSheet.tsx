import type { PointerEvent, SyntheticEvent } from 'react'
import type { Item, ItemChange } from '../../types/item'
import type { Zone } from '../../types/zone'
import './ZoneDetailSheet.css'

interface ZoneDetailSheetProps {
  items: Item[]
  latestChange?: ItemChange
  onAddItem: () => void
  onDecrease: (itemId: string) => void
  onEdit: (itemId: string) => void
  onIncrease: (itemId: string) => void
  quantityPulseId: string | null
  zone: Zone
}

function formatQuantity(quantity: number) {
  return Number.isInteger(quantity) ? String(quantity) : String(Number(quantity.toFixed(2)))
}

function formatRelativeTime(value: string) {
  const elapsed = Date.now() - new Date(value).getTime()
  if (elapsed < 60_000) return '방금 전'
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}분 전`
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}시간 전`
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(new Date(value))
}

export function ZoneDetailSheet({
  items,
  latestChange,
  onAddItem,
  onDecrease,
  onEdit,
  onIncrease,
  quantityPulseId,
  zone
}: ZoneDetailSheetProps) {
  const stopPropagation = (event: SyntheticEvent | PointerEvent) => event.stopPropagation()

  return (
    <aside
      aria-label="구역 상세"
      className="zone-detail-sheet"
      onClick={stopPropagation}
      onPointerDown={stopPropagation}
      onPointerMove={stopPropagation}
      onPointerUp={stopPropagation}
    >
      <div className="detail-handle" aria-hidden="true" />
      <div className="detail-heading">
        <h2>{zone.name}</h2>
        <div className="item-count">
          {items.length === 0 ? '물품 없음' : `물품 ${items.length}개`}
        </div>
      </div>
      <section className="recent-change" aria-label="최근 변경">
        <span>최근 변경</span>
        <strong>{latestChange?.message ?? '아직 변경 내역이 없습니다'}</strong>
        {latestChange && <small>{formatRelativeTime(latestChange.createdAt)}</small>}
      </section>
      <div className="inventory-list">
        {items.length === 0 ? (
          <p className="empty-items">등록된 물품이 없습니다</p>
        ) : items.map((item) => (
          <article
            className="inventory-row"
            key={item.id}
            onClick={() => onEdit(item.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') onEdit(item.id)
            }}
          >
            <div className="inventory-copy">
              <strong>{item.name}</strong>
              {item.memo && <small>{item.memo}</small>}
            </div>
            <div className="quantity-controls">
              <button
                aria-label={`${item.name} 수량 감소`}
                disabled={item.quantity === 0}
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onDecrease(item.id)
                }}
              >
                −
              </button>
              <span className={quantityPulseId === item.id ? 'quantity pulse' : 'quantity'}>
                {formatQuantity(item.quantity)}{item.unit}
              </span>
              <button
                aria-label={`${item.name} 수량 증가`}
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onIncrease(item.id)
                }}
              >
                ＋
              </button>
            </div>
          </article>
        ))}
      </div>
      <button className="add-item-button" type="button" onClick={onAddItem}>
        <span aria-hidden="true">＋</span> 물품 추가
      </button>
    </aside>
  )
}
