/**
 * DOMPurify 封装 — 清洗用户输入，防 XSS 攻击
 * 所有用户生成内容在渲染前必须经过此函数清洗
 */
import DOMPurify from 'dompurify'

export function sanitize(dirty) {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre', 'img', 'span', 'div',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr', 'del', 'ins', 'sub', 'sup',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * 清洗纯文本（去除所有 HTML 标签）
 */
export function sanitizeText(dirty) {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] })
}
