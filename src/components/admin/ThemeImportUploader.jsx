/**
 * 主题素材上传识别 — 上传图片，Canvas 提取主色调，生成调色板建议
 * UI 变量映射：bg-surface, bg-hover, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, rounded-button, border-border
 */
import { useState, useRef } from 'react'
import { Upload, Loader2, Copy, Wand2 } from 'lucide-react'
import toast from 'react-hot-toast'

// 互补色、类似色、分裂互补、三角色方案生成
function generatePalette(hex) {
  const hsl = hexToHsl(hex)
  const schemes = {
    complementary: [hex, hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l)],
    analogous: [
      hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
      hex,
      hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l),
    ],
    splitComplementary: [
      hex,
      hslToHex((hsl.h + 150) % 360, hsl.s, hsl.l),
      hslToHex((hsl.h + 210) % 360, hsl.s, hsl.l),
    ],
    triadic: [
      hex,
      hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
      hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l),
    ],
  }
  return schemes
}

// HEX ↔ HSL 转换（简化版）
function hexToHsl(hex) {
  let r = 0, g = 0, b = 0
  hex = hex.replace('#', '')
  r = parseInt(hex.substring(0, 2), 16) / 255
  g = parseInt(hex.substring(2, 4), 16) / 255
  b = parseInt(hex.substring(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}
function hslToHex(h, s, l) {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

const SCHEME_LABELS = {
  complementary: '互补色',
  analogous: '类似色',
  splitComplementary: '分裂互补色',
  triadic: '三角色',
}

export default function ThemeImportUploader({ onSelectColor }) {
  const canvasRef = useRef(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [dominantColors, setDominantColors] = useState([])
  const [selectedColor, setSelectedColor] = useState(null)
  const [palette, setPalette] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImageUrl(ev.target.result)
      setTimeout(() => extractColors(ev.target.result), 100)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function extractColors(dataUrl) {
    setAnalyzing(true)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const maxW = 200
      const ratio = maxW / img.width
      canvas.width = maxW
      canvas.height = img.height * ratio
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      const colorMap = {}

      // 采样像素，统计颜色（粗糙版 Color Thief）
      for (let i = 0; i < imageData.length; i += 16) {
        const r = imageData[i], g = imageData[i + 1], b = imageData[i + 2]
        // 量化到 32 级减少颜色数
        const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`
        colorMap[key] = (colorMap[key] || 0) + 1
      }

      const sorted = Object.entries(colorMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([key]) => {
          const [r, g, b] = key.split(',').map(Number)
          return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
        })

      setDominantColors(sorted)
      setAnalyzing(false)
      if (sorted.length > 0) handleSelectColor(sorted[0])
    }
    img.src = dataUrl
  }

  function handleSelectColor(color) {
    setSelectedColor(color)
    setPalette(generatePalette(color))
  }

  return (
    <div>
      <canvas ref={canvasRef} className="hidden" />

      {/* 上传区 */}
      {!imageUrl ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-card p-8 cursor-pointer hover:border-accent transition-colors">
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleUpload} hidden />
          <Upload size={32} className="text-muted mb-2" />
          <p className="text-secondary text-sm">上传素材图片</p>
          <p className="text-muted text-xs mt-1">自动提取主色调并生成配色方案</p>
        </label>
      ) : (
        <div>
          {/* 预览 */}
          <div className="flex gap-4 mb-4">
            <img src={imageUrl} alt="" className="w-32 h-24 object-cover rounded-card border border-border" />
            <button onClick={() => { setImageUrl(null); setDominantColors([]); setPalette(null); setSelectedColor(null) }}
              className="text-muted text-xs hover:text-danger self-start mt-1">
              清除
            </button>
          </div>

          {analyzing && (
            <div className="flex items-center gap-2 text-muted text-sm py-4">
              <Loader2 size={16} className="animate-spin" /> 分析中...
            </div>
          )}

          {/* 提取的主色调 */}
          {dominantColors.length > 0 && (
            <div className="mb-4">
              <p className="text-secondary text-xs font-medium mb-2">提取的主色调：</p>
              <div className="flex flex-wrap gap-1.5">
                {dominantColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleSelectColor(c)}
                    className="w-8 h-8 rounded-button border-2 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c, borderColor: selectedColor === c ? 'var(--color-accent)' : 'var(--color-border)' }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 配色方案 */}
          {palette && selectedColor && (
            <div>
              <p className="text-secondary text-xs font-medium mb-2">
                基于 <span className="font-mono text-accent">{selectedColor}</span> 的配色方案：
              </p>
              <div className="space-y-2">
                {Object.entries(palette).map(([scheme, colors]) => (
                  <div key={scheme} className="flex items-center gap-2">
                    <span className="text-muted text-xs w-20">{SCHEME_LABELS[scheme]}</span>
                    <div className="flex gap-1">
                      {colors.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => onSelectColor(c)}
                          className="w-6 h-6 rounded-button border border-border hover:scale-110 transition-transform"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
