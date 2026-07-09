/**
 * UI 变量映射 — 本组件使用的语义类名：
 *   颜色：text-accent
 */
import { cn } from '@/lib/utils'

export default function LoadingSpinner({ size = 'md', className }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent text-accent',
        sizeMap[size],
        className
      )}
      role="status"
      aria-label="加载中"
    />
  )
}
