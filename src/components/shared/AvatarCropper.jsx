import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react'

const CROP_SIZE = 200
const PREVIEW_SIZE = 300

export default function AvatarCropper({ file, onCrop, onCancel }) {
  const [imgSrc, setImgSrc] = useState('')
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 })
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({ x: 0, y: 0 })
  const canvasRef = useRef(null)

  useEffect(() => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        setImgNatural({ w: img.naturalWidth, h: img.naturalHeight })
        const minDim = Math.min(img.naturalWidth, img.naturalHeight)
        const initScale = Math.max(CROP_SIZE / minDim, 0.5)
        setScale(initScale)
        setCrop({ x: (img.naturalWidth - CROP_SIZE / initScale) / 2, y: (img.naturalHeight - CROP_SIZE / initScale) / 2 })
      }
      img.src = e.target.result; setImgSrc(e.target.result)
    }
    reader.readAsDataURL(file)
  }, [file])

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imgSrc) return
    const img = new Image()
    img.onload = () => {
      const ctx = canvas.getContext('2d'); canvas.width = PREVIEW_SIZE; canvas.height = PREVIEW_SIZE
      ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE)
      ctx.drawImage(img, crop.x, crop.y, CROP_SIZE / scale, CROP_SIZE / scale, 0, 0, PREVIEW_SIZE, PREVIEW_SIZE)
    }
    img.src = imgSrc
  }, [imgSrc, crop, scale])

  useEffect(() => { drawPreview() }, [drawPreview])

  const displayScale = Math.min(280 / imgNatural.w, 280 / imgNatural.h, 1) * scale
  const displayW = imgNatural.w * displayScale / scale
  const displayH = imgNatural.h * displayScale / scale
  const cropDisplay = CROP_SIZE * displayScale / scale

  function getEventPos(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left, y: (e.clientY || e.touches?.[0]?.clientY || 0) - rect.top }
  }

  function handleStart(e) { e.preventDefault(); setDragging(true); const p = getEventPos(e); dragRef.current = { x: p.x, y: p.y, cx: crop.x, cy: crop.y } }
  function handleMove(e) {
    if (!dragging) return
    const p = getEventPos(e); const f = scale / displayScale
    const dx = (p.x - dragRef.current.x) * f; const dy = (p.y - dragRef.current.y) * f
    setCrop({ x: Math.max(0, Math.min(imgNatural.w - CROP_SIZE / scale, dragRef.current.cx - dx)), y: Math.max(0, Math.min(imgNatural.h - CROP_SIZE / scale, dragRef.current.cy - dy)) })
  }
  function handleEnd() { setDragging(false) }
  function handleWheel(e) {
    e.preventDefault()
    setScale((prev) => { const n = prev + (e.deltaY > 0 ? -0.1 : 0.1); return Math.min(3, Math.max(Math.max(CROP_SIZE / imgNatural.w, CROP_SIZE / imgNatural.h, 0.2), n)) })
  }
  function handleConfirm() {
    const canvas = canvasRef.current
    canvas.toBlob((blob) => { if (blob) onCrop(new File([blob], 'avatar.jpg', { type: 'image/jpeg' })) }, 'image/jpeg', 0.9)
  }

  const zoomPct = Math.round(scale * 100)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-surface rounded-card shadow-elevated p-5 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-accent text-sm font-medium">裁剪头像 — 拖拽 + 滚轮缩放</h3>
          <button onClick={onCancel} className="text-muted hover:text-primary"><X size={18} /></button>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="relative bg-black/5 rounded overflow-hidden cursor-move select-none" style={{ width: 280, height: 280 }}
            onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}
            onWheel={handleWheel} onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}>
            <img src={imgSrc} alt="" className="absolute block opacity-25"
              style={{ width: displayW, height: displayH, left: -(crop.x * displayScale / scale), top: -(crop.y * displayScale / scale) }} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-white shadow-lg rounded-full" style={{ width: cropDisplay, height: cropDisplay }} />
            </div>
          </div>
          <div className="flex items-center gap-2 w-64">
            <ZoomOut size={14} className="text-muted" />
            <input type="range" min={Math.round(Math.max(CROP_SIZE / imgNatural.w, CROP_SIZE / imgNatural.h, 0.2) * 100)} max={300} value={zoomPct}
              onChange={(e) => setScale(Number(e.target.value) / 100)} className="flex-1 accent-accent h-1.5" />
            <ZoomIn size={14} className="text-muted" />
            <span className="text-muted text-[10px] w-10 text-right">{zoomPct}%</span>
          </div>
          <div><p className="text-muted text-xs mb-1 text-center">预览</p>
            <canvas ref={canvasRef} className="w-20 h-20 rounded-full border-2 border-border" /></div>
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
          <button onClick={onCancel} className="border border-border text-secondary px-4 py-1.5 rounded-button text-sm hover:bg-hover">取消</button>
          <button onClick={handleConfirm} className="bg-accent text-text-inverse px-4 py-1.5 rounded-button text-sm hover:opacity-90 flex items-center gap-1"><Check size={14} /> 确认</button>
        </div>
      </div>
    </div>
  )
}
