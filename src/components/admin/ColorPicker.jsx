/**
 * 颜色选择器 — 单色选取，带 HEX 输入和预设色板
 * UI 变量映射：bg-surface, bg-hover, text-primary, text-secondary, text-muted,
 *   rounded-card, rounded-button, rounded-input, border-border
 */
import { useState } from 'react'
import { Copy } from 'lucide-react'
import toast from 'react-hot-toast'

const PRESET_COLORS = [
  '#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6',  // 紫系
  '#FDE68A', '#FCD34D', '#F59E0B', '#D97706',  // 黄系
  '#EF4444', '#DC2626', '#B91C1C', '#991B1B',  // 红系
  '#10B981', '#059669', '#047857', '#065F46',  // 绿系
  '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF',  // 蓝系
  '#EC4899', '#DB2777', '#BE185D', '#9D174D',  // 粉系
  '#F97316', '#EA580C', '#C2410C', '#9A3412',  // 橙系
  '#6B7280', '#4B5563', '#374151', '#1F2937',  // 灰系
]

export default function ColorPicker({ label, value, onChange }) {
  const [inputValue, setInputValue] = useState(value || '#8B5CF6')
  const [showPicker, setShowPicker] = useState(false)

  function handleInputChange(v) {
    setInputValue(v)
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
      onChange(v)
    }
  }

  function handleBlur() {
    if (!/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
      setInputValue(value) // 恢复合法值
    }
  }

  function copyHex() {
    navigator.clipboard.writeText(value).then(() => toast.success('已复制: ' + value))
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-secondary text-sm w-16 shrink-0">{label}</span>

      {/* 色块预览 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="w-8 h-8 rounded-button border-2 border-border shadow-sm cursor-pointer hover:scale-110 transition-transform"
          style={{ backgroundColor: value }}
          title="点击展开色板"
        />
        {showPicker && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowPicker(false)} />
            <div className="absolute top-10 left-0 z-40 bg-surface rounded-card shadow-elevated border border-border p-3 w-52">
              <div className="grid grid-cols-4 gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { onChange(c); setInputValue(c); setShowPicker(false) }}
                    className="w-10 h-10 rounded-button border-2 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c, borderColor: value === c ? 'var(--color-accent)' : 'transparent' }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* HEX 输入 */}
      <input
        type="text" value={inputValue} onChange={(e) => handleInputChange(e.target.value)}
        onBlur={handleBlur}
        maxLength={7}
        className="w-24 bg-hover border border-border rounded-input px-2 py-1.5 text-primary text-xs font-mono focus:outline-none focus:border-accent"
      />

      <button type="button" onClick={copyHex} className="text-muted hover:text-secondary" title="复制">
        <Copy size={12} />
      </button>
    </div>
  )
}
