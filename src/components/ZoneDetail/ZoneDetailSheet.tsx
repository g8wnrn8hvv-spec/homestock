import { useState, type PointerEvent, type SyntheticEvent } from 'react'
import type { Zone } from '../../types/zone'
import './ZoneDetailSheet.css'

interface ZoneDetailSheetProps {
  zone: Zone
}

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
})

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '확인할 수 없음' : dateFormatter.format(date)
}

export function ZoneDetailSheet({ zone }: ZoneDetailSheetProps) {
  const [noticeVisible, setNoticeVisible] = useState(false)
  const stopPropagation = (event: SyntheticEvent | PointerEvent) => event.stopPropagation()
  const showComingSoon = () => setNoticeVisible(true)

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
        <div>
          <span className="detail-eyebrow">공간</span>
          <h2>{zone.name}</h2>
        </div>
        <div className="item-count" aria-label={`등록된 물품 ${zone.items.length}개`}>
          <strong>{zone.items.length}</strong>
          <span>물품</span>
        </div>
      </div>

      <dl className="zone-dates">
        <div>
          <dt>생성일</dt>
          <dd>{formatDate(zone.createdAt)}</dd>
        </div>
        <div>
          <dt>최근 수정</dt>
          <dd>{formatDate(zone.updatedAt)}</dd>
        </div>
      </dl>

      <div className="detail-actions">
        <button type="button" aria-disabled="true" onClick={showComingSoon}>
          물품 보기
        </button>
        <button type="button" aria-disabled="true" onClick={showComingSoon}>
          <span aria-hidden="true">＋</span> 물품 추가
        </button>
      </div>
      <p className={noticeVisible ? 'coming-soon visible' : 'coming-soon'} aria-live="polite">
        {noticeVisible ? '다음 단계에서 구현됩니다.' : '\u00A0'}
      </p>
    </aside>
  )
}
