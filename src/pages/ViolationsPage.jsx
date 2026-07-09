import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/**
 * UI 变量映射：bg-primary, bg-surface, text-primary, text-secondary, text-muted,
 *   text-danger, rounded-card, shadow-card, font-display
 *
 * 违规公示板 — 对所有用户可见，违规用户昵称/头像模糊打码
 */
export default function ViolationsPage() {
  const navigate = useNavigate()
  // 占位数据，后续从 violations 表读取
  const violations = []

  return (
    <div className="min-h-screen bg-primary">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 bg-surface rounded-button px-3 py-1.5 text-muted text-sm mb-4 hover:text-accent transition-colors shadow-card">
          <ArrowLeft size={16} /> 返回
        </button>
        <div className="bg-surface rounded-card shadow-card p-8">
          <h1 className="font-display text-accent text-2xl mb-2">违规公示板</h1>
          <p className="text-muted text-sm mb-6">
            以下为严重违规记录公示。为保护隐私，违规用户昵称和头像已做模糊处理。
          </p>

          {violations.length === 0 ? (
            <p className="text-muted text-center py-12">
              🎉 近期无违规记录，感谢大家共同维护社区环境！
            </p>
          ) : (
            <div className="space-y-4">
              {violations.map((v) => (
                <div key={v.id} className="border border-border rounded-card p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-muted text-sm filter blur-sm select-none">
                      {v.username_masked}
                    </span>
                    <span className="bg-danger/10 text-danger text-xs px-2 py-0.5 rounded-full">
                      {v.violation_type}
                    </span>
                  </div>
                  <p className="text-secondary text-sm">{v.description}</p>
                  <p className="text-muted text-xs mt-2">
                    处罚：{v.penalty} · 永久公示
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
