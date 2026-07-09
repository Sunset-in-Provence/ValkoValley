/**
 * UI 变量映射 — 本组件使用的语义类名：
 *   文字：text-muted
 *   圆角：rounded-card
 */
import { cn } from '@/lib/utils'

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {Icon && <Icon size={48} className="text-muted mb-4" />}
      {title && <h3 className="text-lg font-medium text-secondary mb-2">{title}</h3>}
      {description && <p className="text-muted text-sm max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
