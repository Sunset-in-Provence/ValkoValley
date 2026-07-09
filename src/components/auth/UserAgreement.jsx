/**
 * 用户协议组件 — 注册时展示社区公约，用户必须勾选同意
 * UI 变量映射：bg-surface, bg-hover, text-primary, text-secondary, text-muted,
 *   text-accent, rounded-card, border-border
 */
import { useState } from 'react'
import communityRules from '@/lib/communityRules'

export default function UserAgreement({ agreed, onAgreeChange }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-border rounded-card overflow-hidden">
      {/* 折叠标题 */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-hover text-secondary text-sm hover:bg-hover/80 transition-colors"
      >
        <span className="font-medium">📜 ValkoValley 社区公约</span>
        <span className="text-muted text-xs">{expanded ? '收起 ▲' : '展开阅读 ▼'}</span>
      </button>

      {/* 公约内容（可折叠） */}
      {expanded && (
        <div className="px-4 py-3 max-h-64 overflow-y-auto bg-surface text-secondary text-xs leading-relaxed space-y-3">
          {communityRules.sections.map((section, i) => (
            <div key={i}>
              <h4 className="font-medium text-primary text-sm mb-1">{section.title}</h4>
              {section.content && <p className="text-muted">{section.content}</p>}
              {section.items && (
                <ul className="list-disc pl-4 space-y-0.5 text-muted">
                  {section.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <p className="text-muted italic pt-2 border-t border-border">
            {communityRules.footer}
          </p>
        </div>
      )}

      {/* 同意勾选框 */}
      <label className="flex items-center gap-2 px-4 py-3 border-t border-border cursor-pointer hover:bg-hover/50 transition-colors">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onAgreeChange(e.target.checked)}
          className="w-4 h-4 rounded-input accent-accent cursor-pointer"
        />
        <span className="text-secondary text-sm">
          我已阅读并同意遵守
          <span className="text-accent font-medium">《ValkoValley 社区公约》</span>
        </span>
      </label>
    </div>
  )
}
