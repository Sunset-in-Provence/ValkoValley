import { useState, useRef, useEffect } from 'react'
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react'

export default function AvatarCropper({ file, onCrop, onCancel }) {
  const [img, setImg] = useState(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const canvasRef = useRef(null)
  const dragRef = useRef(null)
  const areaSize = 280

  useEffect(() => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const i = new Image()
      i.onload = () => {
        const minDim = Math.min(i.naturalWidth, i.naturalHeight)
        const s = Math.max(areaSize / minDim, 0.5)
        setScale(s)
        setImg(i)
        setPos({ x: (i.naturalWidth * s - areaSize) / 2, y: (i.naturalHeight * s - areaSize) / 2 })
      }
      i.src = e.target.result
    }
    reader.readAsDataURL(file)
  }, [file])

  // 绘制预览
  useEffect(() => {
    if (!img) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = 200; canvas.height = 200
    ctx.clearRect(0, 0, 200, 200)
    ctx.beginPath(); ctx.arc(100, 100, 100, 0, Math.PI * 2); ctx.clip()
    const srcW = areaSize / scale; const srcH = areaSize / scale
    ctx.drawImage(img, pos.x / scale, pos.y / scale, srcW, srcH, 0, 0, 200, 200)
  }, [img, pos, scale])

  function handleConfirm() {
    const canvas = canvasRef.current
    canvas.toBlob((blob) => { if (blob) onCrop(new File([blob], 'avatar.jpg', { type: 'image/jpeg' })) }, 'image/jpeg', 0.9)
  }

  function getXY(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: (e.touches?.[0]?.clientX || e.clientX) - rect.left, y: (e.touches?.[0]?.clientY || e.clientY) - rect.top }
  }

  function onStart(e) {
    e.preventDefault()
    dragRef.current = { ...getXY(e), px: pos.x, py: pos.y }
  }

  function onMove(e) {
    if (!dragRef.current) return
    const { x, y } = getXY(e)
    const maxX = Math.max(0, img.naturalWidth * scale - areaSize)
    const maxY = Math.max(0, img.naturalHeight * scale - areaSize)
    setPos({
      x: Math.max(0, Math.min(maxX, dragRef.current.px - (x - dragRef.current.x))),
      y: Math.max(0, Math.min(maxY, dragRef.current.py - (y - dragRef.current.y))),
    })
  }

  function onEnd() { dragRef.current = null }

  if (!img) return null

  const zoomPct = Math.round(scale * 100)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2" onTouchMove={(e) => e.preventDefault()}>
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-surface rounded-card shadow-elevated p-4 w-full max-w-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-accent text-sm font-medium">裁剪头像</h3>
          <button onClick={onCancel} className="text-muted hover:text-primary"><X size={18} /></button>
        </div>

        <div className="flex flex-col items-center gap-3">
          {/* 拖拽区 */}
          <div className="relative rounded-full overflow-hidden bg-black/10 border-2 border-accent"
            style={{ width: areaSize, height: areaSize }}
            onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
            onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}>
            <img src={img.src} alt="" className="absolute select-none"
              style={{ width: img.naturalWidth * scale, height: img.naturalHeight * scale, left: -pos.x, top: -pos.y, maxWidth: 'none' }}
              draggable={false} />
          </div>

          {/* 缩放 */}
          <div className="flex items-center gap-2 w-full max-w-[220px]">
            <ZoomOut size={14} className="text-muted shrink-0" />
            <input type="range" min={Math.round(Math.max(areaSize / img.naturalWidth, areaSize / img.naturalHeight, 0.3) * 100)}
              max={300} value={zoomPct} onChange={(e) => setScale(Number(e.target.value) / 100)}
              className="flex-1 accent-accent" />
            <ZoomIn size={14} className="text-muted shrink-0" />
            <span className="text-muted text-[10px] w-10 text-right">{zoomPct}%</span>
          </div>

          {/* 预览 */}
          <div className="text-center">
            <p className="text-muted text-[10px] mb-1">预览</p>
            <canvas ref={canvasRef} className="w-16 h-16 rounded-full border-2 border-border" />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border">
          <button onClick={onCancel} className="border border-border text-secondary px-4 py-1.5 rounded-button text-xs hover:bg-hover">取消</button>
          <button onClick={handleConfirm} className="bg-accent text-text-inverse px-4 py-1.5 rounded-button text-xs hover:opacity-90 flex items-center gap-1"><Check size={14} /> 确认</button>
        </div>
      </div>
    </div>
  )
}
