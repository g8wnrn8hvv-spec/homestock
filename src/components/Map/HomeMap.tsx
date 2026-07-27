import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { spaces } from './spaces'
import './HomeMap.css'

interface Transform {
  x: number
  y: number
  scale: number
}

interface Gesture {
  kind: 'pan' | 'pinch'
  origin: { x: number; y: number }
  distance: number
  transform: Transform
}

const MIN_SCALE = 0.85
const MAX_SCALE = 2.8
const DRAG_THRESHOLD = 6

function getDistance(a: PointerEvent, b: PointerEvent) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

function getMidpoint(a: PointerEvent, b: PointerEvent) {
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }
}

export function HomeMap() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef<Transform>({ x: 0, y: 0, scale: 1 })
  const pointersRef = useRef(new Map<number, PointerEvent>())
  const gestureRef = useRef<Gesture | null>(null)
  const frameRef = useRef<number | null>(null)
  const movedRef = useRef(false)

  const renderTransform = (next: Transform) => {
    transformRef.current = next
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => {
      if (stageRef.current) {
        stageRef.current.style.transform =
          `translate3d(${next.x}px, ${next.y}px, 0) scale3d(${next.scale}, ${next.scale}, 1)`
      }
      frameRef.current = null
    })
  }

  const beginGesture = () => {
    const active = [...pointersRef.current.values()]
    if (active.length === 1) {
      gestureRef.current = {
        kind: 'pan',
        origin: { x: active[0].clientX, y: active[0].clientY },
        distance: 0,
        transform: { ...transformRef.current }
      }
    } else if (active.length === 2) {
      gestureRef.current = {
        kind: 'pinch',
        origin: getMidpoint(active[0], active[1]),
        distance: getDistance(active[0], active[1]),
        transform: { ...transformRef.current }
      }
    }
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    pointersRef.current.set(event.pointerId, event.nativeEvent)
    if (pointersRef.current.size === 1) movedRef.current = false
    beginGesture()
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId) || !gestureRef.current) return
    pointersRef.current.set(event.pointerId, event.nativeEvent)
    const active = [...pointersRef.current.values()]
    const gesture = gestureRef.current

    if (active.length === 1 && gesture.kind === 'pan') {
      const dx = active[0].clientX - gesture.origin.x
      const dy = active[0].clientY - gesture.origin.y
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD) movedRef.current = true
      renderTransform({
        x: gesture.transform.x + dx,
        y: gesture.transform.y + dy,
        scale: gesture.transform.scale
      })
      return
    }

    if (active.length === 2 && gesture.kind === 'pinch') {
      const currentMidpoint = getMidpoint(active[0], active[1])
      const rawScale = gesture.transform.scale * (getDistance(active[0], active[1]) / gesture.distance)
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, rawScale))
      const scaleRatio = nextScale / gesture.transform.scale
      movedRef.current = true
      renderTransform({
        x: currentMidpoint.x - (gesture.origin.x - gesture.transform.x) * scaleRatio,
        y: currentMidpoint.y - (gesture.origin.y - gesture.transform.y) * scaleRatio,
        scale: nextScale
      })
    }
  }

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId)
    gestureRef.current = null
    if (pointersRef.current.size > 0) beginGesture()
  }

  const selectSpace = (spaceId: string) => {
    if (movedRef.current) {
      movedRef.current = false
      return
    }
    setSelectedId((current) => current === spaceId ? null : spaceId)
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
        <div className="map-stage" ref={stageRef}>
          <svg className="home-map" viewBox="0 0 560 640" role="img" aria-label="HomeStock 공간 지도">
            <g className="map-rooms">
              {spaces.map((space) => (
                <path
                  aria-label={space.name}
                  className={selectedId === space.id ? 'room selected' : 'room'}
                  d={space.path}
                  fill={space.color}
                  key={space.id}
                  onClick={() => selectSpace(space.id)}
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
        한 손가락으로 이동 · 두 손가락으로 확대
      </p>
    </section>
  )
}
