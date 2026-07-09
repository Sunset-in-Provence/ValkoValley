/**
 * 管理后台 — 举报审核仪表板
 *
 * 功能：
 *   - 按状态筛选（待处理/已处理/已驳回）
 *   - 按举报数量自动排列优先级
 *   - 删除内容 / 封禁用户 / 驳回举报
 *
 * UI 变量映射：bg-primary, bg-surface, text-primary, text-secondary, text-muted, text-accent,
 *   text-danger, text-warning, text-success, text-info,
 *   rounded-card, rounded-button, rounded-full, shadow-card, font-display, border-border
 */
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import ReportCard from '@/components/admin/ReportCard'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Shield, Filter, RefreshCw, BookOpen, Palette as PaletteIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_FILTERS = [
  { key: 'pending', label: '待处理', color: 'text-warning' },
  { key: 'resolved', label: '已处理', color: 'text-success' },
  { key: 'dismissed', label: '已驳回', color: 'text-muted' },
]

export default function AdminPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  const fetchReports = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('status', filter)
      .order('created_at', { ascending: false })

    if (data) {
      // 按被举报内容聚合，计数排序
      const countMap = {}
      data.forEach((r) => {
        const key = `${r.target_type}:${r.target_id}`
        countMap[key] = (countMap[key] || 0) + 1
      })
      // 标记重复举报数
      const enriched = data.map((r) => ({
        ...r,
        duplicate_count: countMap[`${r.target_type}:${r.target_id}`] || 1,
      }))
      // 排序：重复举报多的在前
      enriched.sort((a, b) => b.duplicate_count - a.duplicate_count)
      setReports(enriched)
    }
    setLoading(false)
  }, [filter])

  useEffect(() => { fetchReports() }, [fetchReports])

  const counts = {
    pending: reports.filter((r) => r.status === 'pending').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
    dismissed: reports.filter((r) => r.status === 'dismissed').length,
  }

  return (
    <div>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-accent text-2xl flex items-center gap-2">
            <Shield size={24} /> 管理后台
          </h1>
          <p className="text-muted text-sm mt-1">举报审核 · 内容管理</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/exam"
            className="flex items-center gap-1 text-muted text-sm no-underline hover:text-accent px-3 py-1.5 rounded-button border border-border">
            <BookOpen size={14} /> 题库管理
          </Link>
          <Link to="/admin/theme"
            className="flex items-center gap-1 text-muted text-sm no-underline hover:text-accent px-3 py-1.5 rounded-button border border-border">
            <PaletteIcon size={14} /> 主题管理
          </Link>
          <button onClick={fetchReports}
            className="flex items-center gap-1 text-muted text-sm hover:text-accent px-3 py-1.5 rounded-button border border-border">
            <RefreshCw size={14} /> 刷新
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface rounded-card shadow-card p-4 text-center">
          <p className="text-warning text-2xl font-display">{counts.pending}</p>
          <p className="text-muted text-xs mt-1">待处理</p>
        </div>
        <div className="bg-surface rounded-card shadow-card p-4 text-center">
          <p className="text-success text-2xl font-display">{counts.resolved}</p>
          <p className="text-muted text-xs mt-1">已处理</p>
        </div>
        <div className="bg-surface rounded-card shadow-card p-4 text-center">
          <p className="text-muted text-2xl font-display">{counts.dismissed}</p>
          <p className="text-muted text-xs mt-1">已驳回</p>
        </div>
      </div>

      {/* 筛选 + 排序说明 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {STATUS_FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={cn('px-4 py-1.5 rounded-full text-xs transition-colors',
                filter === f.key
                  ? 'bg-accent text-text-inverse'
                  : 'bg-surface text-secondary border border-border hover:bg-hover')}>
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-muted text-xs flex items-center gap-1">
          <Filter size={12} />
          {filter === 'pending' ? '按被举报次数降序排列' : '按时间降序'}
        </span>
      </div>

      {/* 报告列表 */}
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : reports.length === 0 ? (
        <EmptyState icon={Shield} title="暂无举报"
          description={filter === 'pending' ? '没有待处理的举报，社区状态良好' : ''} />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id}>
              {report.duplicate_count > 1 && (
                <div className="text-warning text-xs mb-1 px-2">
                  ⚠️ 同一内容被举报 {report.duplicate_count} 次
                </div>
              )}
              <ReportCard report={report} onAction={fetchReports} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
