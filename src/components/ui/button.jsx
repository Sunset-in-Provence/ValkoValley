/**
 * UI 变量映射 — shadcn/ui Button 骨架
 *   背景：bg-accent (默认), bg-hover (ghost), bg-danger (destructive)
 *   文字：text-text-inverse, text-secondary, text-danger
 *   圆角：rounded-button
 *   字体：font-body
 *
 * 此组件仅定义结构，颜色/圆角全部引用语义类名。
 */
import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-accent text-text-inverse hover:opacity-90',
  secondary: 'bg-hover text-secondary hover:bg-hover/80',
  outline: 'border border-border text-secondary hover:bg-hover',
  ghost: 'text-secondary hover:bg-hover',
  destructive: 'bg-danger text-text-inverse hover:opacity-90',
  link: 'text-accent underline-offset-4 hover:underline',
}

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
}

export default function Button({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-button font-body font-medium transition-all',
        'focus:outline-none focus:ring-2 focus:ring-accent/50',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
