/**
 * 标签选择器 — 年龄分级（必选）+ 创作类型（必选）+ 自定义标签
 * UI 变量映射：bg-surface, bg-hover, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, rounded-button, rounded-input, rounded-full, border-border
 */
import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const CONTENT_TYPE_OPTIONS = [
  { key: 'text', label: '📝 文' },
  { key: 'image', label: '🖼️ 图' },
  { key: 'video', label: '🎬 视频' },
]

const TYPE_OPTIONS = [
  { key: '原创', label: '🖊️ 原创' },
  { key: '二创', label: '✨ 二创' },
]

export default function TagSelector({ rating, onRatingChange, type, onTypeChange, customTags = [], onCustomTagsChange }) {
  const [tagInput, setTagInput] = useState('')

  function addTag() {
    const tag = tagInput.trim()
    if (!tag || customTags.includes(tag)) { setTagInput(''); return }
    onCustomTagsChange([...customTags, tag])
    setTagInput('')
  }

  function removeTag(tag) {
    onCustomTagsChange(customTags.filter((t) => t !== tag))
  }

  return (
    <div className="space-y-4">
      {/* 内容类型（必选） */}
      <div>
        <label className="text-secondary text-sm font-medium mb-2 block">
          类型 <span className="text-danger">*</span>
        </label>
        <div className="flex gap-2">
          {CONTENT_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onRatingChange(opt.key)}
              className={cn(
                'flex-1 px-3 py-2 rounded-button text-xs text-center border transition-colors',
                rating === opt.key
                  ? 'bg-accent text-text-inverse border-accent'
                  : 'bg-hover text-secondary border-border hover:border-accent'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 创作类型（必选） */}
      <div>
        <label className="text-secondary text-sm font-medium mb-2 block">
          创作类型 <span className="text-danger">*</span>
        </label>
        <div className="flex gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onTypeChange(opt.key)}
              className={cn(
                'flex-1 px-3 py-2 rounded-button text-xs text-center border transition-colors',
                type === opt.key
                  ? 'bg-accent text-text-inverse border-accent'
                  : 'bg-hover text-secondary border-border hover:border-accent'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 自定义标签 */}
      <div>
        <label className="text-secondary text-sm font-medium mb-2 block">
          自定义标签 <span className="text-muted text-xs">（可选，如：同人文、手绘、MAD、考据等）</span>
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text" value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
            placeholder="输入标签回车添加"
            className="flex-1 bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm focus:outline-none focus:border-accent"
          />
          <button type="button" onClick={addTag}
            className="bg-hover border border-border text-secondary px-3 py-2 rounded-button text-sm hover:bg-accent hover:text-text-inverse">
            添加
          </button>
        </div>
        {customTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {customTags.map((tag) => (
              <span key={tag}
                className="inline-flex items-center gap-1 bg-accent/10 text-accent text-xs px-2 py-1 rounded-full">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-danger">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
