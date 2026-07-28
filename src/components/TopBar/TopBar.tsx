import './TopBar.css'

interface TopBarProps {
  isEditing: boolean
  onToggleEditing: () => void
}

export function TopBar({ isEditing, onToggleEditing }: TopBarProps) {
  return (
    <header className="top-bar">
      <h1>HomeStock</h1>
      <button
        type="button"
        aria-label={isEditing ? '지도 편집 완료' : '지도 편집'}
        aria-pressed={isEditing}
        onClick={onToggleEditing}
      >
        {isEditing ? '완료' : '편집'}
      </button>
    </header>
  )
}
