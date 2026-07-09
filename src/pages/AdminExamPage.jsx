/**
 * 题库管理页（占位）
 * 功能：增删改查考试题目，分公约题库和敖尹题库两个 Tab
 */
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function AdminExamPage() {
  return (
    <div className="min-h-screen bg-primary">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/admin" className="flex items-center gap-1 text-muted text-sm mb-6 no-underline hover:text-accent">
          <ArrowLeft size={14} /> 返回管理后台
        </Link>

        <h1 className="font-display text-accent text-2xl mb-6">题库管理</h1>

        <div className="bg-surface rounded-card shadow-card p-6">
          <div className="flex gap-4 mb-6">
            <button className="bg-accent text-text-inverse px-4 py-2 rounded-button text-sm">
              📜 公约题库
            </button>
            <button className="border border-border text-secondary px-4 py-2 rounded-button text-sm hover:bg-hover">
              🐺 敖尹题库
            </button>
          </div>
          <p className="text-muted text-sm">
            题库双存储设计：前端文件 <code className="bg-hover px-1 rounded-input text-xs">src/lib/examQuestions.js</code> 作为默认题库，
            可在管理后台一键同步到数据库 <code className="bg-hover px-1 rounded-input text-xs">exam_questions</code> 表。
          </p>
          <p className="text-secondary text-xs mt-4">完整实现在 Phase 7</p>
        </div>
      </div>
    </div>
  )
}
