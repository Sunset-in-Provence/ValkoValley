/**
 * 档案馆主页 — 分类目录 + 卡片列表
 * UI 变量映射：bg-primary, bg-surface, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, rounded-button, rounded-full, shadow-card, font-display
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import LibraryCard from '@/components/library/LibraryCard'
import EmptyState from '@/components/shared/EmptyState'
import { BookOpen, Plus, Search, Pin } from 'lucide-react'
import { cn } from '@/lib/utils'

const categories = [
  { key: 'all', label: '全部', icon: '📚' },
  { key: 'character', label: '角色设定', icon: '👤' },
  { key: 'worldview', label: '世界观', icon: '🌍' },
  { key: 'timeline', label: '剧情年表', icon: '📅' },
  { key: 'gallery', label: '官方图鉴', icon: '🖼️' },
  { key: 'music', label: '音乐/OST', icon: '🎵' },
  { key: 'other', label: '其他', icon: '📦' },
]

export default function LibraryPage() {
  const { isAdmin } = useAuth()
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 占位数据 — 后续从 Supabase 加载
  const entries = []

  const filtered = entries.filter((e) => {
    const matchCategory = activeCategory === 'all' || e.category === activeCategory
    const matchSearch =
      !searchQuery ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchCategory && matchSearch
  })

  return (
    <div>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-accent text-2xl">📚 档案馆</h1>
          <p className="text-muted text-sm mt-1">敖尹官方设定资料存档 · 社区共建</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link
              to="/library/new"
              className="flex items-center gap-1.5 bg-accent text-text-inverse px-4 py-2 rounded-button text-sm no-underline hover:opacity-90"
            >
              <Plus size={16} />
              添加条目
            </Link>
          )}
          <Link
            to="/library/submit"
            className="flex items-center gap-1.5 border border-border text-secondary px-4 py-2 rounded-button text-sm no-underline hover:bg-hover"
          >
            <Plus size={16} />
            投稿
          </Link>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="搜索设定..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-hover border border-border rounded-input pl-9 pr-4 py-2 text-primary text-sm focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* 分类标签 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm transition-colors',
              activeCategory === cat.key
                ? 'bg-accent text-text-inverse'
                : 'bg-surface text-secondary border border-border hover:bg-hover'
            )}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* 置顶条目 */}
      {entries.filter((e) => e.is_pinned).length > 0 && (
        <div className="mb-6">
          <h2 className="font-display text-accent text-lg mb-3 flex items-center gap-1.5">
            <Pin size={16} /> 置顶
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries
              .filter((e) => e.is_pinned && (activeCategory === 'all' || e.category === activeCategory))
              .map((entry) => (
                <LibraryCard key={entry.id} entry={entry} />
              ))}
          </div>
        </div>
      )}

      {/* 条目列表 */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="该分类下暂无条目"
          description="欢迎投稿补充敖尹设定资料！"
          action={
            <Link
              to="/library/submit"
              className="bg-accent text-text-inverse px-4 py-2 rounded-button text-sm no-underline"
            >
              提交投稿
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((entry) => (
            <LibraryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
