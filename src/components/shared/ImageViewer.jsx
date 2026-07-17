import { useState, useCallback, useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

const MIN_ZOOM = 1
const MAX_ZOOM = 5
const ZOOM_STEP = 0.25

export default function ImageViewer({ images, current, onClose, onPrev, onNext }) {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const posStart = useRef({ x: 0, y: 0 })

  // 换图时重置缩放
  useEffect(() => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }, [current])

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
    if (e.key === 'ArrowLeft') onPrev()
    if (e.key === 'ArrowRight') onNext()
    if (e.key === '+' || e.key === '=') zoomIn()
    if (e.key === '-') zoomOut()
    if (e.key === '0') resetZoom()
  }, [onClose, onPrev, onNext])

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [handleKey])

  function zoomIn() { setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM)) }
  function zoomOut() {
    setZoom((z) => {
      const next = Math.max(z - ZOOM_STEP, MIN_ZOOM)
      if (next === MIN_ZOOM) setPosition({ x: 0, y: 0 })
      return next
    })
  }
  function resetZoom() { setZoom(1); setPosition({ x: 0, y: 0 }) }

  function handleWheel(e) {
    e.preventDefault()
    if (e.deltaY < 0) zoomIn()
    else zoomOut()
  }

  function handleMouseDown(e) {
    if (zoom <= 1) return
    e.preventDefault()
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY }
    posStart.current = { ...position }
  }

  function handleMouseMove(e) {
    if (!dragging) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setPosition({ x: posStart.current.x + dx, y: posStart.current.y + dy })
  }

  function handleMouseUp() { setDragging(false) }

  function handleDoubleClick(e) {
    e.stopPropagation()
    if (zoom > 1) resetZoom()
    else setZoom(2)
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center select-none"
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={onClose}>

      {/* 关闭按钮 */}
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white z-10"><X size={28} /></button>

      {/* 计数 + 缩放百分比 */}
      <div className="text-white/50 text-sm absolute top-4 left-4 flex items-center gap-3">
        <span>{current + 1} / {images.length}</span>
        {zoom > 1 && <span>{(zoom * 100).toFixed(0)}%</span>}
      </div>

      {/* 左右箭头 */}
      {images.length > 1 && (
        <button onClick={(e) => { e.stopPropagation(); onPrev() }}
          className="absolute left-2 sm:left-4 text-white/70 hover:text-white z-10 p-2">
          <ChevronLeft size={36} />
        </button>
      )}

      {/* 图片 */}
      <div className={`${zoom > 1 ? 'cursor-grab' : ''} ${dragging ? 'cursor-grabbing' : ''}`}
        onClick={(e) => e.stopPropagation()}>
        <img src={images[current]} alt=""
          className="max-w-[90vw] max-h-[90vh] object-contain"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            transition: dragging ? 'none' : 'transform 0.15s ease-out',
          }}
          draggable={false}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick} />
      </div>

      {/* 右箭头 */}
      {images.length > 1 && (
        <button onClick={(e) => { e.stopPropagation(); onNext() }}
          className="absolute right-2 sm:right-4 text-white/70 hover:text-white z-10 p-2">
          <ChevronRight size={36} />
        </button>
      )}

      {/* 底部缩放工具栏 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-3 py-2"
        onClick={(e) => e.stopPropagation()}>
        <button onClick={zoomOut} disabled={zoom <= MIN_ZOOM}
          className="text-white/70 hover:text-white disabled:opacity-30 p-1 transition-colors">
          <ZoomOut size={18} />
        </button>
        <button onClick={resetZoom}
          className="text-white/70 hover:text-white px-2 text-xs font-medium min-w-[40px] transition-colors">
          {(zoom * 100).toFixed(0)}%
        </button>
        <button onClick={zoomIn} disabled={zoom >= MAX_ZOOM}
          className="text-white/70 hover:text-white disabled:opacity-30 p-1 transition-colors">
          <ZoomIn size={18} />
        </button>
        {zoom > 1 && (
          <button onClick={resetZoom} className="text-white/50 hover:text-white p-1 transition-colors ml-1" title="重置 (0)">
            <RotateCcw size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
