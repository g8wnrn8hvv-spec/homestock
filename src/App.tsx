import { useState } from 'react'
import { HomeMap } from './components/Map/HomeMap'
import { TopBar } from './components/TopBar/TopBar'

export default function App() {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <main className="app-shell">
      <TopBar isEditing={isEditing} onToggleEditing={() => setIsEditing((current) => !current)} />
      <HomeMap isEditing={isEditing} />
    </main>
  )
}
