/**
 * Markdown 渲染封装
 * 使用 react-markdown + remark-gfm，先 DOMPurify 清洗再渲染
 */
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { sanitize } from './sanitize'

/**
 * 将 Markdown 文本渲染为 React 组件
 * @param {string} content - Markdown 原始文本
 * @returns {JSX.Element}
 */
export function renderMarkdown(content) {
  const cleaned = sanitize(content)
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // 链接在新窗口打开
        a: ({ href, children, ...props }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
            {children}
          </a>
        ),
        // 图片懒加载
        img: ({ src, alt, ...props }) => (
          <img src={src} alt={alt} loading="lazy" {...props} />
        ),
      }}
    >
      {cleaned}
    </ReactMarkdown>
  )
}
