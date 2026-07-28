import type { PointerEvent, SyntheticEvent } from 'react'
import type { Item } from '../../types/item'
import type { Zone } from '../../types/zone'
import './ZoneDetailSheet.css'

interface ZoneDetailSheetProps {
  items: Item[]
  onAddItem: () => void
  onBack: () => void
  onViewItems: () => void
  view: 'detail' | 'items'
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
  onAddItem,
  onBack,
  onViewItems,
  view,
  zone
}: ZoneDetailSheetProps) {
  const stopPropagation = (event: SyntheticEvent | PointerEvent) => event.stopPropagation()
  const latestItem = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

  return (
    <aside
      aria-label={view === 'detail' ? '구역 상세' : '구역 물품'}
      className="zone-detail-sheet"
      onClick={stopPropagation}
      onPointerDown={stopPropagation}
      onPointerMove={stopPropagation}
      onPointerUp={stopPropagation}
    >
      <div className="detail-handle" aria-hidden="true" />
      {view === 'detail' ? (
        <>
          <div className="detail-heading">
            <h2>{zone.name}</h2>
            <div className="item-count">
              {items.length === 0 ? '물품 없음' : `물품 ${items.length}개`}
            </div>
          </div>
          <section className="recent-change" aria-label="최근 변경">
            <span>최근 변경</span>
            {latestItem ? (
              <>
                <strong>{latestItem.name} {formatQuantity(latestItem.quantity)}{latestItem.unit} 추가</strong>
                <small>{formatRelativeTime(latestItem.createdAt)}</small>
              </>
            ) : (
              <strong>아직 변경 내역이 없습니다</strong>
            )}
          </section>
          <div className="detail-actions">
            <button type="button" onClick={onViewItems}>물품 보기</button>
            <button type="button" className="primary" onClick={onAddItem}>
              <span aria-hidden="true">＋</span> 물품 추가
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="list-heading">
            <button type="button" aria-label="구역 상세로 돌아가기" onClick={onBack}>‹</button>
            <div>
              <span>{zone.name}</span>
              <h2>물품</h2>
            </div>
          </div>
          {items.length === 0 ? (
            <p className="empty-items">등록된 물품이 없습니다</p>
          ) : (
            <ul className="item-list">
              {items.map((item) => (
                <li key={item.id}>
                  <span>{item.name}</span>
                  <strong>{formatQuantity(item.quantity)}{item.unit}</strong>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </aside>
  )
}
