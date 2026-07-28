import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent
} from 'react'
import { createDefaultZones } from '../../data/defaultZones'
import { zoneRepository } from '../../repositories/ZoneRepository'
import { MAX_ZONE_NAME_LENGTH, zoneService } from '../../services/ZoneService'
import type { Point, Zone } from '../../types/zone'
import {
  ZoneEditorSheet,
  type ZoneDraft
} from '../ZoneEditor/ZoneEditorSheet'
import './HomeMap.css'

interface Transform {
  x: number
  y: number
  scale: number
}

interface Gesture {
  kind: 'pan' | 'pinch'
  origin: Point
  distance: number
  transform: Transform
}

interface MapMetrics {
  fitScale: number
  maxScale: number
  stageHeight: number
  stageWidth: number
  viewportHeight: number
  viewportWidth: number
}

interface StoredMapView extends Transform {
  version: 1
}

const STORAGE_KEY = 'homestock:map-view'
const STORAGE_VERSION = 1
const VIEW_PADDING = 20
const FOCUS_PADDING = 36
const DRAG_THRESHOLD = 7
const ANIMATION_DURATION = 280
const EDITOR_CLOSE_DURATION = 160

function getDistance(a: PointerEvent, b: PointerEvent) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

function getMidpoint(a: PointerEvent, b: PointerEvent) {
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }
}

function roundedPolygonPath(points: Point[], radius: number) {
  const corners = points.map((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length]
    const next = points[(index + 1) % points.length]
    const incomingLength = Math.hypot(previous.x - point.x, previous.y - point.y)
    const outgoingLength = Math.hypot(next.x - point.x, next.y - point.y)
    const cornerRadius = Math.min(radius, incomingLength / 2, outgoingLength / 2)

    return {
      point,
      start: {
        x: point.x + ((previous.x - point.x) / incomingLength) * cornerRadius,
        y: point.y + ((previous.y - point.y) / incomingLength) * cornerRadius
      },
      end: {
        x: point.x + ((next.x - point.x) / outgoingLength) * cornerRadius,
        y: point.y + ((next.y - point.y) / outgoingLength) * cornerRadius
      }
    }
  })

  const commands = [`M ${corners[0].start.x} ${corners[0].start.y}`]
  corners.forEach(({ point, start, end }, index) => {
    if (index > 0) commands.push(`L ${start.x} ${start.y}`)
    commands.push(`Q ${point.x} ${point.y} ${end.x} ${end.y}`)
  })
  commands.push(`L ${corners[0].start.x} ${corners[0].start.y}`, 'Z')
  return commands.join(' ')
}

function getBounds(zone: Zone) {
  const xs = zone.polygon.points.map(({ x }) => x)
  const ys = zone.polygon.points.map(({ y }) => y)
  const left = Math.min(...xs)
  const right = Math.max(...xs)
  const top = Math.min(...ys)
  const bottom = Math.max(...ys)
  return { left, right, top, bottom, width: right - left, height: bottom - top }
}

function getPolygonCentroid(points: Point[]): Point {
  let crossSum = 0
  let xSum = 0
  let ySum = 0

  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]
    const cross = point.x * next.y - next.x * point.y
    crossSum += cross
    xSum += (point.x + next.x) * cross
    ySum += (point.y + next.y) * cross
  })

  if (Math.abs(crossSum) < Number.EPSILON) {
    return {
      x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
      y: points.reduce((sum, point) => sum + point.y, 0) / points.length
    }
  }

  return {
    x: xSum / (3 * crossSum),
    y: ySum / (3 * crossSum)
  }
}

function getLabelFontSize(width: number, height: number) {
  return Math.min(12.5, Math.max(9.5, Math.min(width, height) / 6.5))
}

function getZoneLabel(name: string, width: number, fontSize: number) {
  const maxCharacters = Math.max(2, Math.floor(width / (fontSize * 0.85)))
  return name.length > maxCharacters ? `${name.slice(0, maxCharacters)}…` : name
}

interface HomeMapProps {
  isEditing: boolean
}

export function HomeMap({ isEditing }: HomeMapProps) {
  const [zones, setZones] = useState<Zone[]>(() => createDefaultZones())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorClosing, setEditorClosing] = useState(false)
  const [draft, setDraft] = useState<ZoneDraft | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef<Transform>({ x: 0, y: 0, scale: 1 })
  const appliedTransformRef = useRef<Transform>({ x: 0, y: 0, scale: 1 })
  const pointersRef = useRef(new Map<number, PointerEvent>())
  const gestureRef = useRef<Gesture | null>(null)
  const frameRef = useRef<number | null>(null)
  const animationTimerRef = useRef<number | null>(null)
  const editorCloseTimerRef = useRef<number | null>(null)
  const pendingTransformRef = useRef<Transform | null>(null)
  const movedRef = useRef(false)
  const initializedRef = useRef(false)

  const getMetrics = useCallback((): MapMetrics | null => {
    const viewport = viewportRef.current
    const stage = stageRef.current
    if (!viewport || !stage) return null

    const viewportWidth = viewport.clientWidth
    const viewportHeight = viewport.clientHeight
    const stageWidth = stage.offsetWidth
    const stageHeight = stage.offsetHeight
    if (!viewportWidth || !viewportHeight || !stageWidth || !stageHeight) return null

    const fitScale = Math.min(
      1,
      (viewportWidth - VIEW_PADDING * 2) / stageWidth,
      (viewportHeight - VIEW_PADDING * 2) / stageHeight
    )

    return {
      fitScale,
      maxScale: Math.min(4, Math.max(2.5, fitScale * 3.25)),
      stageHeight,
      stageWidth,
      viewportHeight,
      viewportWidth
    }
  }, [])

  const getFitTransform = useCallback((): Transform | null => {
    const metrics = getMetrics()
    if (!metrics) return null
    return {
      x: (metrics.stageWidth - metrics.stageWidth * metrics.fitScale) / 2,
      y: (metrics.stageHeight - metrics.stageHeight * metrics.fitScale) / 2,
      scale: metrics.fitScale
    }
  }, [getMetrics])

  const persistTransform = useCallback((transform: Transform) => {
    try {
      const stored: StoredMapView = { version: STORAGE_VERSION, ...transform }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    } catch {
      // Private browsing or storage limits must never block map interaction.
    }
  }, [])

  const applyTransform = useCallback((next: Transform) => {
    transformRef.current = next
    pendingTransformRef.current = next
    if (frameRef.current !== null) return
    frameRef.current = requestAnimationFrame(() => {
      const pending = pendingTransformRef.current
      if (stageRef.current && pending) {
        stageRef.current.style.transform =
          `translate3d(${pending.x}px, ${pending.y}px, 0) scale3d(${pending.scale}, ${pending.scale}, 1)`
        stageRef.current.style.setProperty('--label-inverse-scale', String(1 / pending.scale))
        appliedTransformRef.current = pending
      }
      pendingTransformRef.current = null
      frameRef.current = null
    })
  }, [])

  const stopAnimation = useCallback(() => {
    const stage = stageRef.current
    if (!stage || !stage.classList.contains('map-stage--animating')) return

    const matrix = new DOMMatrixReadOnly(getComputedStyle(stage).transform)
    const current = { x: matrix.e, y: matrix.f, scale: matrix.a }
    stage.classList.remove('map-stage--animating')
    stage.style.transform =
      `translate3d(${current.x}px, ${current.y}px, 0) scale3d(${current.scale}, ${current.scale}, 1)`
    stage.style.setProperty('--label-inverse-scale', String(1 / current.scale))
    transformRef.current = current
    appliedTransformRef.current = current
    pendingTransformRef.current = null
    if (animationTimerRef.current !== null) window.clearTimeout(animationTimerRef.current)
    animationTimerRef.current = null
  }, [])

  const animateTransform = useCallback((next: Transform) => {
    const stage = stageRef.current
    if (!stage) return
    stopAnimation()
    transformRef.current = next
    stage.classList.add('map-stage--animating')
    requestAnimationFrame(() => {
      stage.style.transform =
        `translate3d(${next.x}px, ${next.y}px, 0) scale3d(${next.scale}, ${next.scale}, 1)`
      stage.style.setProperty('--label-inverse-scale', String(1 / next.scale))
      appliedTransformRef.current = next
    })
    animationTimerRef.current = window.setTimeout(() => {
      stage.classList.remove('map-stage--animating')
      animationTimerRef.current = null
      persistTransform(next)
    }, ANIMATION_DURATION + 40)
  }, [persistTransform, stopAnimation])

  const toStageCoordinates = useCallback((point: Point) => {
    const stage = stageRef.current
    if (!stage) return point
    const stageRect = stage.getBoundingClientRect()
    const applied = appliedTransformRef.current
    return {
      x: point.x - (stageRect.left - applied.x),
      y: point.y - (stageRect.top - applied.y)
    }
  }, [])

  useEffect(() => {
    setZones(zoneRepository.load())
  }, [])

  useEffect(() => {
    if (isEditing) return
    setEditorOpen(false)
    setEditorClosing(false)
    setDraft(null)
  }, [isEditing])

  useEffect(() => {
    const initialize = () => {
      const metrics = getMetrics()
      const fallback = getFitTransform()
      if (!metrics || !fallback) return

      let initial = fallback
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '') as Partial<StoredMapView>
        const isFiniteTransform =
          Number.isFinite(stored.x) && Number.isFinite(stored.y) && Number.isFinite(stored.scale)
        const isCompatible =
          stored.version === STORAGE_VERSION &&
          isFiniteTransform &&
          stored.scale! >= metrics.fitScale &&
          stored.scale! <= metrics.maxScale &&
          Math.abs(stored.x!) <= metrics.stageWidth * metrics.maxScale * 2 &&
          Math.abs(stored.y!) <= metrics.stageHeight * metrics.maxScale * 2

        if (isCompatible) {
          initial = { x: stored.x!, y: stored.y!, scale: stored.scale! }
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }

      applyTransform(initial)
      initializedRef.current = true
    }

    const frame = requestAnimationFrame(initialize)
    const observer = new ResizeObserver(() => {
      if (!initializedRef.current) return
      const metrics = getMetrics()
      const current = transformRef.current
      if (!metrics || (current.scale >= metrics.fitScale && current.scale <= metrics.maxScale)) return
      const fallback = getFitTransform()
      if (fallback) applyTransform(fallback)
    })
    if (viewportRef.current) observer.observe(viewportRef.current)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      if (animationTimerRef.current !== null) window.clearTimeout(animationTimerRef.current)
      if (editorCloseTimerRef.current !== null) window.clearTimeout(editorCloseTimerRef.current)
    }
  }, [applyTransform, getFitTransform, getMetrics])

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
        origin: toStageCoordinates(getMidpoint(active[0], active[1])),
        distance: getDistance(active[0], active[1]),
        transform: { ...transformRef.current }
      }
    }
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    stopAnimation()
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
      applyTransform({
        x: gesture.transform.x + dx,
        y: gesture.transform.y + dy,
        scale: gesture.transform.scale
      })
      return
    }

    if (active.length === 2 && gesture.kind === 'pinch') {
      const metrics = getMetrics()
      if (!metrics) return
      const currentMidpoint = toStageCoordinates(getMidpoint(active[0], active[1]))
      const rawScale = gesture.transform.scale * (getDistance(active[0], active[1]) / gesture.distance)
      const nextScale = Math.min(metrics.maxScale, Math.max(metrics.fitScale, rawScale))
      const scaleRatio = nextScale / gesture.transform.scale
      movedRef.current = true
      applyTransform({
        x: currentMidpoint.x - (gesture.origin.x - gesture.transform.x) * scaleRatio,
        y: currentMidpoint.y - (gesture.origin.y - gesture.transform.y) * scaleRatio,
        scale: nextScale
      })
    }
  }

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId)
    gestureRef.current = null
    if (pointersRef.current.size > 0) {
      beginGesture()
    } else {
      persistTransform(transformRef.current)
    }
  }

  const focusZone = (zone: Zone) => {
    if (import.meta.env.DEV) {
      console.info('[HomeStock Zone]', {
        id: zone.id,
        name: zone.name,
        items: zone.items,
        polygonPointCount: zone.polygon.points.length,
        zone
      })
    }
    if (isEditing) {
      if (selectedId === zone.id && editorOpen) {
        setSelectedId(null)
        setEditorClosing(true)
        editorCloseTimerRef.current = window.setTimeout(() => {
          setEditorOpen(false)
          setEditorClosing(false)
          setDraft(null)
          editorCloseTimerRef.current = null
        }, EDITOR_CLOSE_DURATION)
        return
      }
      if (editorCloseTimerRef.current !== null) window.clearTimeout(editorCloseTimerRef.current)
      editorCloseTimerRef.current = null
      setEditorClosing(false)
      setSelectedId(zone.id)
      setDraft({ name: zone.name, color: zone.color })
      setEditorOpen(true)
      return
    }

    if (selectedId === zone.id) return
    setSelectedId(zone.id)

    const metrics = getMetrics()
    const viewport = viewportRef.current
    const stage = stageRef.current
    if (!metrics || !viewport || !stage) return

    const bounds = getBounds(zone)
    const unitScale = metrics.stageWidth / 560
    const roomFitScale = Math.min(
      (metrics.viewportWidth - FOCUS_PADDING * 2) / (bounds.width * unitScale),
      (metrics.viewportHeight - FOCUS_PADDING * 2) / (bounds.height * unitScale),
      metrics.maxScale
    )
    const readableScale = Math.min(
      metrics.maxScale,
      Math.max(metrics.fitScale, 116 / (Math.min(bounds.width, bounds.height) * unitScale))
    )
    const nextScale = Math.min(roomFitScale, Math.max(transformRef.current.scale, readableScale))
    const stageRect = stage.getBoundingClientRect()
    const applied = appliedTransformRef.current
    const baseLeft = stageRect.left - applied.x
    const baseTop = stageRect.top - applied.y
    const viewportRect = viewport.getBoundingClientRect()
    const targetX = viewportRect.left + metrics.viewportWidth / 2 - baseLeft
    const targetY = viewportRect.top + metrics.viewportHeight / 2 - baseTop
    const roomCenterX = ((bounds.left + bounds.right) / 2) * unitScale
    const roomCenterY = ((bounds.top + bounds.bottom) / 2) * unitScale

    animateTransform({
      x: targetX - roomCenterX * nextScale,
      y: targetY - roomCenterY * nextScale,
      scale: nextScale
    })
  }

  const handleMapClick = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest('.room')) return
    if (movedRef.current) return
    setSelectedId(null)
  }

  const showFullMap = () => {
    const fit = getFitTransform()
    if (!fit) return
    setSelectedId(null)
    animateTransform(fit)
  }

  const cancelEditingZone = () => {
    setEditorClosing(true)
    editorCloseTimerRef.current = window.setTimeout(() => {
      setEditorOpen(false)
      setEditorClosing(false)
      setDraft(null)
      editorCloseTimerRef.current = null
    }, EDITOR_CLOSE_DURATION)
  }

  const saveEditingZone = () => {
    if (!selectedId || !draft) return
    const current = zoneRepository.getZone(selectedId)
    if (!current) {
      cancelEditingZone()
      return
    }

    const normalizedName = draft.name.trim()
    if (!normalizedName) return
    if (normalizedName !== current.name) zoneService.renameZone(selectedId, normalizedName)
    if (draft.color.toUpperCase() !== current.color.toUpperCase()) {
      zoneService.changeColor(selectedId, draft.color)
    }
    setZones(zoneRepository.getAllZones())
    cancelEditingZone()
  }

  const activeDraftZoneId = editorOpen ? selectedId : null

  return (
    <section
      className={editorOpen ? 'map-section map-section--editor-open' : 'map-section'}
      aria-label="집 공간 지도"
    >
      <div
        className="map-viewport"
        onClick={handleMapClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        ref={viewportRef}
      >
        <div className="map-stage" ref={stageRef}>
          <svg className="home-map" viewBox="0 0 560 640" role="img" aria-label="HomeStock 공간 지도">
            <g className="map-rooms">
              {zones.filter((zone) => zone.visible).map((zone) => {
                const bounds = getBounds(zone)
                const preview = activeDraftZoneId === zone.id && draft ? draft : null
                const displayName = preview?.name.trim() || zone.name
                const centroid = getPolygonCentroid(zone.polygon.points)
                const labelFontSize = getLabelFontSize(bounds.width, bounds.height)
                const labelStyle = {
                  '--zone-label-size': `${labelFontSize}px`
                } as CSSProperties
                return (
                  <g className="zone" key={zone.id}>
                    <path
                      aria-label={zone.name}
                      className={selectedId === zone.id ? 'room selected' : 'room'}
                      d={roundedPolygonPath(zone.polygon.points, zone.polygon.cornerRadius)}
                      fill={preview?.color ?? zone.color}
                      onClick={() => {
                        if (movedRef.current) return
                        focusZone(zone)
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          focusZone(zone)
                        }
                      }}
                    />
                    <text
                      aria-hidden="true"
                      className={selectedId === zone.id ? 'zone-label selected' : 'zone-label'}
                      style={labelStyle}
                      x={centroid.x}
                      y={centroid.y}
                    >
                      {getZoneLabel(displayName, bounds.width, labelFontSize)}
                    </text>
                  </g>
                )
              })}
            </g>
          </svg>
        </div>
      </div>
      <div className="map-actions">
        <button
          className="fit-map-button"
          type="button"
          aria-label="집 전체 지도 보기"
          onClick={showFullMap}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M4.5 10.5 12 4.4l7.5 6.1v7.1a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2Z" />
            <path d="M9.2 19.6v-5.4h5.6v5.4" />
          </svg>
        </button>
      </div>
      <p className="gesture-hint" aria-hidden="true">
        한 손가락으로 이동 · 두 손가락으로 확대
      </p>
      {isEditing && editorOpen && draft && (
        <ZoneEditorSheet
          draft={draft}
          isClosing={editorClosing}
          maxNameLength={MAX_ZONE_NAME_LENGTH}
          onCancel={cancelEditingZone}
          onChange={setDraft}
          onSave={saveEditingZone}
        />
      )}
    </section>
  )
}
