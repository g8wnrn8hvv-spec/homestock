import type { PointerEvent, SyntheticEvent } from 'react'
import './ZoneEditorSheet.css'

export interface ZoneDraft {
  name: string
  color: string
}

interface ZoneEditorSheetProps {
  draft: ZoneDraft
  maxNameLength: number
  onCancel: () => void
  onChange: (draft: ZoneDraft) => void
  onSave: () => void
}

export const ZONE_COLORS = [
  { name: '연노랑', value: '#F4E4BB' },
  { name: '연파랑', value: '#CFE0ED' },
  { name: '연보라', value: '#DED3E5' },
  { name: '연초록', value: '#D7EAD8' },
  { name: '연베이지', value: '#F0E2CF' },
  { name: '연회색', value: '#E5E1DD' },
  { name: '연분홍', value: '#EFCFD7' },
  { name: '연민트', value: '#CFE6DF' }
] as const

export function ZoneEditorSheet({
  draft,
  maxNameLength,
  onCancel,
  onChange,
  onSave
}: ZoneEditorSheetProps) {
  const stopPropagation = (event: SyntheticEvent | PointerEvent) => event.stopPropagation()
  const normalizedName = draft.name.trim()

  return (
    <aside
      aria-label="구역 편집"
      className="zone-editor-sheet"
      onClick={stopPropagation}
      onPointerDown={stopPropagation}
      onPointerMove={stopPropagation}
      onPointerUp={stopPropagation}
    >
      <div className="sheet-handle" aria-hidden="true" />
      <div className="sheet-heading">
        <div>
          <span className="sheet-eyebrow">구역 편집</span>
          <h2>{normalizedName || '이름 없는 구역'}</h2>
        </div>
        <span className="current-color" style={{ backgroundColor: draft.color }} aria-hidden="true" />
      </div>

      <label className="name-field">
        <span>이름</span>
        <input
          aria-label="구역 이름"
          autoComplete="off"
          maxLength={maxNameLength}
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
        />
        <small>{draft.name.length}/{maxNameLength}</small>
      </label>

      <fieldset className="color-field">
        <legend>색상</legend>
        <div className="color-palette">
          {ZONE_COLORS.map((color) => (
            <button
              type="button"
              className="color-option"
              aria-label={color.name}
              aria-pressed={draft.color.toUpperCase() === color.value}
              key={color.value}
              onClick={() => onChange({ ...draft, color: color.value })}
              style={{ backgroundColor: color.value }}
            >
              <span aria-hidden="true">✓</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="sheet-actions">
        <button type="button" className="cancel-button" onClick={onCancel}>취소</button>
        <button
          type="button"
          className="save-button"
          disabled={!normalizedName}
          onClick={onSave}
        >
          저장
        </button>
      </div>
    </aside>
  )
}
