import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并 Tailwind 类名，自动处理冲突
 * shadcn/ui 标准工具函数
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
