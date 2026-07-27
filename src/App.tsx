import { HomeMap } from './components/Map/HomeMap'
import { TopBar } from './components/TopBar/TopBar'

export default function App() {
  return (
    <main className="app-shell">
      <TopBar />
      <HomeMap />
    </main>
  )
}
