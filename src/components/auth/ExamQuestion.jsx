import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ExamQuestion({ question, index, selectedAnswer, onSelect, locked }) {
  const isAnswered = selectedAnswer !== undefined && selectedAnswer !== null
  const isCorrect = selectedAnswer === question.correctIndex

  return (
    <div className="border-b border-border pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <p className="text-sm font-medium mb-3" style={{ color: '#111' }}>
        <span className="font-display mr-1" style={{ color: '#1a6b3c' }}>{index + 1}.</span>
        {question.question}
      </p>

      <div className="flex flex-col gap-1.5">
        {question.options.map((opt, oi) => {
          const isSelected = selectedAnswer === oi
          const isCorrectOption = oi === question.correctIndex

          let borderClass = 'border-border'
          let bgClass = 'bg-hover'
          let textStyle = { color: '#333' }

          if (locked || isAnswered) {
            if (isCorrectOption) {
              borderClass = 'border-success'
              bgClass = 'bg-success/10'
              textStyle = { color: '#166534' }
            } else if (isSelected && !isCorrectOption) {
              borderClass = 'border-danger'
              bgClass = 'bg-danger/10'
              textStyle = { color: '#991b1b' }
            }
          }

          const disabled = locked || isAnswered

          return (
            <button
              key={oi}
              onClick={() => !disabled && onSelect(index, oi)}
              disabled={disabled}
              className={cn(
                'flex items-center gap-2 border rounded-button px-3 py-2.5 text-sm text-left transition-all',
                borderClass, bgClass,
                !disabled && isSelected && 'border-accent bg-accent/10',
                !disabled && !isSelected && 'hover:border-accent hover:bg-hover/80 cursor-pointer',
                disabled && 'cursor-default'
              )}
              style={(!disabled && isSelected) ? { color: '#1a6b3c' } : textStyle}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center shrink-0 text-xs">
                {String.fromCharCode(65 + oi)}
              </span>
              <span className="flex-1">{opt}</span>
              {locked && isCorrectOption && <Check size={16} className="text-success shrink-0" />}
              {locked && isSelected && !isCorrectOption && <X size={16} className="text-danger shrink-0" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
