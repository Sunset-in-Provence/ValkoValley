/**
 * 主题管理页 — 手动编辑配色 / 上传素材提取主色调 / 调色板建议
 *
 * 修改 tailwind.config.js 中的颜色值后，全站所有组件的视觉效果
 * 会自动同步，无需逐个文件修改。
 *
 * UI 变量映射：bg-surface, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, rounded-button, shadow-card, font-display, border-border
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import ColorPicker from '@/components/admin/ColorPicker'
import ThemeImportUploader from '@/components/admin/ThemeImportUploader'
import { Shield, Save, Undo2 } from 'lucide-react'
import toast from 'react-hot-toast'

const DEFAULT_COLORS = {
  primary: '#B8E6CC',
  secondary: '#FDE68A',
  surface: '#FFFFFF',
  muted: '#7FA890',
  accent: '#5DAF7C',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
}

const LABELS = {
  primary: '主色（品牌色、导航栏、强调按钮）',
  secondary: '辅色（背景对比色）',
  surface: '表层色（卡片/组件底色）',
  muted: '弱化文字（时间戳、提示）',
  accent: '强调色（标题、链接、高亮）',
  danger: '危险色（删除、封禁、错误）',
  success: '成功色（通过、完成）',
  warning: '警告色（待处理、提醒）',
  info: '信息色（通知、引导）',
}

export default function AdminThemePage() {
  const [colors, setColors] = useState(DEFAULT_COLORS)
  const [activeTab, setActiveTab] = useState('manual') // 'manual' | 'import'

  function handleColorChange(key, value) {
    setColors((prev) => ({ ...prev, [key]: value }))
  }

  function handleReset() {
    setColors(DEFAULT_COLORS)
    toast.success('已恢复默认配色')
  }

  function handleSave() {
    // 生成配置 JSON 供管理员复制到 tailwind.config.js
    const json = JSON.stringify(
      Object.fromEntries(
        Object.entries(colors).map(([k, v]) => [k, v])
      ),
      null, 2
    )
    navigator.clipboard.writeText(json).then(() => {
      toast.success('配色 JSON 已复制到剪贴板！请粘贴到 tailwind.config.js')
    })
  }

  function handleImportColor(color) {
    // 智能分配：选择最接近已有空缺的颜色槽
    // 简化版：交替分配给 primary, accent, secondary
    const keys = Object.keys(colors)
    const unusedKeys = keys.filter((k) => !Object.values(colors).includes(color))
    if (unusedKeys.length > 0) {
      handleColorChange(unusedKeys[0], color)
      toast.success(`已分配颜色到 ${LABELS[unusedKeys[0]].split('（')[0]}`)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-accent text-2xl flex items-center gap-2">
            <Shield size={24} /> 主题管理
          </h1>
          <p className="text-muted text-sm mt-1">修改全局配色 · 上传素材提取主色调</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset}
            className="flex items-center gap-1 text-muted text-sm px-3 py-1.5 rounded-button border border-border hover:bg-hover">
            <Undo2 size={14} /> 恢复默认
          </button>
          <button onClick={handleSave}
            className="flex items-center gap-1 bg-accent text-text-inverse text-sm px-4 py-2 rounded-button hover:opacity-90">
            <Save size={14} /> 导出配置
          </button>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 mb-6 border-b border-border">
        <button onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 text-sm rounded-t-card transition-colors ${
            activeTab === 'manual'
              ? 'text-accent border-b-2 border-accent -mb-[2px] font-medium'
              : 'text-muted hover:text-secondary'
          }`}>
          🎨 手动编辑
        </button>
        <button onClick={() => setActiveTab('import')}
          className={`px-4 py-2 text-sm rounded-t-card transition-colors ${
            activeTab === 'import'
              ? 'text-accent border-b-2 border-accent -mb-[2px] font-medium'
              : 'text-muted hover:text-secondary'
          }`}>
          📷 素材提取
        </button>
      </div>

      {activeTab === 'manual' ? (
        <div className="bg-surface rounded-card shadow-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(colors).map(([key, value]) => (
              <div key={key} className="bg-hover rounded-card p-3">
                <ColorPicker
                  label={key}
                  value={value}
                  onChange={(v) => handleColorChange(key, v)}
                />
                <p className="text-muted text-[10px] mt-1.5 ml-20">{LABELS[key]}</p>
              </div>
            ))}
          </div>

          {/* 预览条 */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-secondary text-xs font-medium mb-3">预览：</p>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="w-12 h-8 rounded-button" style={{ backgroundColor: colors.primary }} title="primary" />
                <div className="w-12 h-8 rounded-button" style={{ backgroundColor: colors.secondary }} title="secondary" />
                <div className="w-12 h-8 rounded-button border" style={{ backgroundColor: colors.surface }} title="surface" />
                <div className="w-12 h-8 rounded-button" style={{ backgroundColor: colors.accent }} title="accent" />
                <div className="w-12 h-8 rounded-button" style={{ backgroundColor: colors.danger }} title="danger" />
                <div className="w-12 h-8 rounded-button" style={{ backgroundColor: colors.success }} title="success" />
                <div className="w-12 h-8 rounded-button" style={{ backgroundColor: colors.warning }} title="warning" />
                <div className="w-12 h-8 rounded-button" style={{ backgroundColor: colors.info }} title="info" />
              </div>
              <div className="flex gap-2 text-sm">
                <span style={{ color: colors.primary }}>primary 文字</span>
                <span style={{ color: colors.secondary }}>secondary 文字</span>
                <span style={{ color: colors.muted }}>muted 文字</span>
                <span style={{ color: colors.accent }}>accent 文字</span>
                <span style={{ color: colors.danger }}>danger 文字</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-card shadow-card p-6">
          <ThemeImportUploader onSelectColor={handleImportColor} />
        </div>
      )}

      <div className="mt-6 bg-info/10 border border-info/30 rounded-card p-4">
        <p className="text-secondary text-xs">
          💡 <strong>如何应用新配色：</strong>
          点击"导出配置"按钮 → 复制生成的 JSON → 粘贴到 <code className="bg-hover px-1 rounded">tailwind.config.js</code> 的
          <code className="bg-hover px-1 rounded">theme.extend.colors</code> 中 → 重新构建部署。
          或者直接告诉我你想要的配色描述，由我来修改配置文件。
        </p>
      </div>

      <div className="mt-4 text-center">
        <Link to="/admin" className="text-muted text-xs no-underline hover:text-accent">
          ← 返回管理后台
        </Link>
      </div>
    </div>
  )
}
