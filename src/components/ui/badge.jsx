/**
 * UI 变量映射 — Badge 骨架
 *   背景：bg-accent, bg-success, bg-danger, bg-warning, bg-info
 *   文字：text-text-inverse
 *   圆角：rounded-full
 */
import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-accent text-text-inverse',
  success: 'bg-success text-text-inverse',
  danger: 'bg-danger text-text-inverse',
  warning: 'bg-warning text-text-inverse',
  info: 'bg-info text-text-inverse',
  outline: 'border border-border text-secondary',
}

export default function Badge({ variant = 'default', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
