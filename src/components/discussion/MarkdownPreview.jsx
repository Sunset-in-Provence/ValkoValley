/**
 * Markdown 实时预览组件 — 分屏编辑+预览 或 纯预览模式
 * UI 变量映射：bg-surface, bg-hover, text-primary, text-secondary, text-muted,
 *   rounded-card, rounded-input, border-border
 */
import { useState } from 'react'
import { renderMarkdown } from '@/lib/markdown'

export default function MarkdownPreview({ content, onChange, readOnly = false, placeholder = '支持 Markdown 格式...', rows = 10 }) {
  const [tab, setTab] = useState(readOnly ? 'preview' : 'edit')

  if (readOnly) {
    return (
      <div className="prose prose-sm max-w-none text-secondary font-body">
        {renderMarkdown(content)}
      </div>
    )
  }

  return (
    <div className="border border-border rounded-card overflow-hidden">
      {/* Tab 切换 */}
      <div className="flex bg-hover border-b border-border">
        <button
          onClick={() => setTab('edit')}
          className={`px-4 py-2 text-xs font-medium transition-colors ${
            tab === 'edit' ? 'bg-surface text-accent border-b-2 border-accent' : 'text-muted hover:text-secondary'
          }`}
        >
          ✏️ 编辑
        </button>
        <button
          onClick={() => setTab('preview')}
          className={`px-4 py-2 text-xs font-medium transition-colors ${
            tab === 'preview' ? 'bg-surface text-accent border-b-2 border-accent' : 'text-muted hover:text-secondary'
          }`}
        >
          👁️ 预览
        </button>
      </div>

      {/* 内容区 */}
      <div className="p-4">
        {tab === 'edit' ? (
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full bg-hover border-0 rounded-input p-3 text-primary text-sm font-mono resize-vertical focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        ) : (
          <div className="prose prose-sm max-w-none text-secondary font-body min-h-[200px]">
            {content ? renderMarkdown(content) : (
              <p className="text-muted italic">暂无内容，切换到"编辑"开始写作</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
