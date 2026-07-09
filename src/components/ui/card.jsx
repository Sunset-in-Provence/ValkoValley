/**
 * UI 变量映射 — shadcn/ui Card 骨架
 *   背景：bg-surface  文字：text-primary, text-secondary, text-muted
 *   圆角：rounded-card  阴影：shadow-card
 */
import { cn } from '@/lib/utils'

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('bg-surface rounded-card shadow-card', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }) {
  return <div className={cn('px-6 pt-6 pb-0', className)} {...props}>{children}</div>
}

export function CardContent({ className, children, ...props }) {
  return <div className={cn('px-6 py-4', className)} {...props}>{children}</div>
}

export function CardFooter({ className, children, ...props }) {
  return <div className={cn('px-6 pb-6 pt-0', className)} {...props}>{children}</div>
}
