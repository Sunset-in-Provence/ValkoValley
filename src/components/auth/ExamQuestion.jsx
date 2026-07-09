/**
 * 单道考试题组件 — 即时反馈对错
 * UI 变量映射：bg-surface, bg-hover, text-primary, text-secondary, text-muted,
 *   text-success, text-danger, rounded-button, border-border
 */
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ExamQuestion({ question, index, selectedAnswer, onSelect, showResult }) {
  const isAnswered = selectedAnswer !== undefined && selectedAnswer !== null
  const isCorrect = selectedAnswer === question.correctIndex

  return (
    <div className="border-b border-border pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      {/* 题号 + 题目 */}
      <p className="text-primary text-sm font-medium mb-3">
        <span className="text-accent font-display mr-1">{index + 1}.</span>
        {question.question}
      </p>

      {/* 选项 */}
      <div className="flex flex-col gap-1.5">
        {question.options.map((opt, oi) => {
          const isSelected = selectedAnswer === oi
          const isCorrectOption = oi === question.correctIndex

          let borderClass = 'border-border'
          let bgClass = 'bg-hover'
          let textClass = 'text-secondary'

          if (showResult || isAnswered) {
            if (isCorrectOption) {
              borderClass = 'border-success'
              bgClass = 'bg-success/10'
              textClass = 'text-success'
            } else if (isSelected && !isCorrectOption) {
              borderClass = 'border-danger'
              bgClass = 'bg-danger/10'
              textClass = 'text-danger'
            }
          }

          return (
            <button
              key={oi}
              onClick={() => !showResult && onSelect(index, oi)}
              disabled={showResult}
              className={cn(
                'flex items-center gap-2 border rounded-button px-3 py-2.5 text-sm text-left transition-all',
                borderClass, bgClass, textClass,
                !showResult && !isSelected && 'hover:border-accent hover:bg-hover/80 cursor-pointer',
                !showResult && isSelected && 'border-accent bg-accent/10 text-accent',
                showResult && 'cursor-default'
              )}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center shrink-0 text-xs">
                {String.fromCharCode(65 + oi)}
              </span>
              <span className="flex-1">{opt}</span>
              {showResult && isCorrectOption && <Check size={16} className="text-success shrink-0" />}
              {showResult && isSelected && !isCorrectOption && <X size={16} className="text-danger shrink-0" />}
            </button>
          )
        })}
      </div>

      {/* 已选答案即时反馈（非最终提交时） */}
      {isAnswered && !showResult && (
        <p className={cn('text-xs mt-2', isCorrect ? 'text-success' : 'text-danger')}>
          {isCorrect ? '✓ 回答正确' : '✗ 回答错误'}
        </p>
      )}
    </div>
  )
}
