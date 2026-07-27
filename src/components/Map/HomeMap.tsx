import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { spaces } from './spaces'
import './HomeMap.css'

interface Transform {
  x: number
  y: number
  scale: number
}

interface Gesture {
  distance: number
  midpoint: { x: number; y: number }
  transform: Transform
}

const MIN_SCALE = 0.85
const MAX_SCALE = 2.8

function distance(a: PointerEvent, b: PointerEvent) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

function midpoint(a: PointerEvent, b: PointerEvent) {
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }
}

export function HomeMap() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 })
  const pointers = useRef(new Map<number, PointerEvent>())
  const gesture = useRef<Gesture | null>(null)

  const beginGesture = () => {
    const active = [...pointers.current.values()]
    if (active.length !== 2) return
    gesture.current = {
      distance: distance(active[0], active[1]),
      midpoint: midpoint(active[0], active[1]),
      transform
    }
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, event.nativeEvent)
    if (pointers.current.size === 2) beginGesture()
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return
    pointers.current.set(event.pointerId, event.nativeEvent)
    const active = [...pointers.current.values()]
    if (active.length !== 2 || !gesture.current) return

    const currentMidpoint = midpoint(active[0], active[1])
    const ratio = distance(active[0], active[1]) / gesture.current.distance
    const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, gesture.current.transform.scale * ratio))
    setTransform({
      x: gesture.current.transform.x + currentMidpoint.x - gesture.current.midpoint.x,
      y: gesture.current.transform.y + currentMidpoint.y - gesture.current.midpoint.y,
      scale: nextScale
    })
  }

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId)
    gesture.current = null
    if (pointers.current.size === 2) beginGesture()
  }

  return (
    <section className="map-section" aria-label="집 공간 지도">
      <div
        className="map-viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <div
          className="map-stage"
          style={{ transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})` }}
        >
          <svg className="home-map" viewBox="0 0 560 640" role="img" aria-label="HomeStock 공간 지도">
            <g className="map-rooms">
              {spaces.map((space) => (
                <path
                  aria-label={space.name}
                  className={selectedId === space.id ? 'room selected' : 'room'}
                  d={space.path}
                  fill={space.color}
                  key={space.id}
                  onClick={() => setSelectedId((current) => current === space.id ? null : space.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedId((current) => current === space.id ? null : space.id)
                    }
                  }}
                />
              ))}
            </g>
          </svg>
        </div>
      </div>
      <p className="gesture-hint" aria-hidden="true">
        <span className="gesture-icon">⌁</span>
        두 손가락으로 지도를 움직여보세요
      </p>
    </section>
  )
}
