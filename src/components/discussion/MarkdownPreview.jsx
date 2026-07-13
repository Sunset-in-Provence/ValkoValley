import { renderMarkdown } from '@/lib/markdown'

export default function MarkdownPreview({ content, onChange, readOnly = false, placeholder = '输入正文...', rows = 10 }) {
  if (readOnly) {
    return <div className="text-secondary font-body text-sm">{renderMarkdown(content)}</div>
  }

  return (
    <textarea
      value={content}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-hover border border-border rounded-input p-3 text-primary text-sm resize-vertical focus:outline-none focus:border-accent"
    />
  )
}
