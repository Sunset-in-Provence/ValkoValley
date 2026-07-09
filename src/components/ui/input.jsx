/**
 * UI 变量映射 — shadcn/ui Input 骨架
 *   背景：bg-hover  文字：text-primary  边框：border-border
 *   圆角：rounded-input  字体：font-body
 */
import { cn } from '@/lib/utils'

export default function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'flex h-10 w-full bg-hover border border-border rounded-input px-3 py-2',
        'text-primary text-sm font-body',
        'placeholder:text-muted',
        'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30',
        'disabled:opacity-50 disabled:pointer-events-none',
        className
      )}
      {...props}
    />
  )
}
