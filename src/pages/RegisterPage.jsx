/**
 * 注册页面 — 完整两阶段入站考试流程
 *
 * 流程：填写信息 + 同意公约
 *       → 第一阶段：公约考试（随机 10 题，≥80% 通过）
 *       → 第二阶段：敖尹考试（随机 10 题，≥80% 通过）
 *       → 创建账户
 *
 * UI 变量映射：bg-primary, bg-surface, bg-hover,
 *   text-primary, text-secondary, text-muted, text-accent, text-success, text-danger,
 *   rounded-card, rounded-button, rounded-input, shadow-card, shadow-elevated,
 *   border-border, font-display, font-body
 */
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import examQuestions from '@/lib/examQuestions'
import ExamQuestion from '@/components/auth/ExamQuestion'
import UserAgreement from '@/components/auth/UserAgreement'

const QUESTIONS_PER_STAGE = 10
const PASS_THRESHOLD = 0.8 // 80%
const COOLDOWN_KEY = 'valkovalley-exam-cooldown'
const COOLDOWN_MINUTES = 30

/** 从题库中随机抽取不重复题目 */
function pickQuestions(pool, count) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

export default function RegisterPage() {
  const navigate = useNavigate()

  // ---- 表单状态 ----
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [inviteRequired, setInviteRequired] = useState(true)

  useEffect(() => {
    async function check() {
      const { data } = await supabase.from('site_settings').select('value').eq('key', 'invite_only').maybeSingle()
      setInviteRequired(!data || data.value !== 'false')
    }
    check()
  }, [])
  const [agreed, setAgreed] = useState(false)

  // ---- 流程状态 ----
  const [step, setStep] = useState('form') // 'form' | 'rules_exam' | 'aoyin_exam' | 'result'
  const [loading, setLoading] = useState(false)

  // ---- 考试状态 ----
  const [rulesQuestions, setRulesQuestions] = useState([])
  const [aoyinQuestions, setAoyinQuestions] = useState([])
  const [rulesAnswers, setRulesAnswers] = useState({})    // { questionIndex: selectedOptionIndex }
  const [aoyinAnswers, setAoyinAnswers] = useState({})
  const [rulesSubmitted, setRulesSubmitted] = useState(false)
  const [aoyinSubmitted, setAoyinSubmitted] = useState(false)

  // ---- 考试结果 ----
  const [rulesResult, setRulesResult] = useState(null)    // { correct, total, passed }
  const [aoyinResult, setAoyinResult] = useState(null)

  // 分离题库
  const rulesPool = examQuestions.filter((q) => q.category === 'rules')
  const aoyinPool = examQuestions.filter((q) => q.category === 'aoyin')

  // ---- 处理函数 ----

  /** 选择答案 — 立即锁定，不可更改 */
  function handleAnswer(stage, questionIndex, optionIndex) {
    if (stage === 'rules') {
      if (rulesSubmitted || rulesAnswers[questionIndex] !== undefined) return
      setRulesAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }))
    } else {
      if (aoyinSubmitted || aoyinAnswers[questionIndex] !== undefined) return
      setAoyinAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }))
    }
  }

  /** 检查冷却 */
  function checkCooldown() {
    const until = localStorage.getItem(COOLDOWN_KEY)
    if (until && Date.now() < parseInt(until)) {
      const mins = Math.ceil((parseInt(until) - Date.now()) / 60000)
      toast.error(`考试未通过，请等待 ${mins} 分钟后再试`)
      return true
    }
    return false
  }

  /** 开始第一阶段考试 */
  async function startExam() {
    if (!agreed) { toast.error('请先阅读并同意社区公约'); return }
    if (!email.trim() || !password.trim() || !username.trim()) {
      toast.error('请填写完整信息'); return
    }
    if (password.length < 6) { toast.error('密码至少 6 位'); return }
    if (username.length < 2 || username.length > 30) {
      toast.error('用户名需 2-30 个字符'); return
    }
      if (inviteRequired) {
      if (!inviteCode.trim()) { toast.error('请输入邀请码'); return }
      const { data: codeData } = await supabase.from('invite_codes')
        .select('*').eq('code', inviteCode.trim().toUpperCase()).eq('is_active', true).single()
      if (!codeData) { toast.error('邀请码无效'); return }
      if (codeData.used_count >= codeData.max_uses) { toast.error('邀请码已用完'); return }
    }
    if (checkCooldown()) return

    if (rulesPool.length < QUESTIONS_PER_STAGE) {
      toast.error(`公约题库不足 ${QUESTIONS_PER_STAGE} 题，请联系管理员补充`)
      return
    }

    const picked = pickQuestions(rulesPool, QUESTIONS_PER_STAGE)
    setRulesQuestions(picked)
    setRulesAnswers({})
    setRulesSubmitted(false)
    setRulesResult(null)
    setStep('rules_exam')
  }

  /** 提交第一阶段：公约考试 */
  function submitRulesExam() {
    const answered = Object.keys(rulesAnswers).length
    if (answered < rulesQuestions.length) {
      toast.error(`还有 ${rulesQuestions.length - answered} 题未作答`)
      return
    }

    setRulesSubmitted(true)
    const correct = rulesQuestions.filter((q, i) => rulesAnswers[i] === q.correctIndex).length
    const pct = correct / rulesQuestions.length
    const passed = pct >= PASS_THRESHOLD

    setRulesResult({ correct, total: rulesQuestions.length, passed })

    // 保存考试记录
    const rWrong = rulesQuestions
      .filter((q, i) => rulesAnswers[i] !== q.correctIndex)
      .map((q, i) => ({ question: q.question, picked: q.options[rulesAnswers[i]] || '未作答', correct: q.options[q.correctIndex] }))
    supabase.from('exam_attempts').insert({ email, username, stage: 'rules', passed, correct_count: correct, total_count: rulesQuestions.length, wrong_details: rWrong }).then()

    if (passed) {
      toast.success(`公约考试通过！(${correct}/${rulesQuestions.length})`)

      // 检查敖尹题库
      if (aoyinPool.length < QUESTIONS_PER_STAGE) {
        toast.error(`敖尹题库不足 ${QUESTIONS_PER_STAGE} 题，请联系管理员补充`)
        return
      }

      // 短暂延迟后进入第二阶段
      setTimeout(() => {
        const picked = pickQuestions(aoyinPool, QUESTIONS_PER_STAGE)
        setAoyinQuestions(picked)
        setAoyinAnswers({})
        setAoyinSubmitted(false)
        setAoyinResult(null)
        setStep('aoyin_exam')
      }, 1500)
    } else {
      localStorage.setItem(COOLDOWN_KEY, String(Date.now() + COOLDOWN_MINUTES * 60000))
      toast.error(`公约考试未通过（${correct}/${rulesQuestions.length}），请 ${COOLDOWN_MINUTES} 分钟后再试`)
    }
  }

  /** 提交第二阶段：敖尹考试 */
  function submitAoyinExam() {
    const answered = Object.keys(aoyinAnswers).length
    if (answered < aoyinQuestions.length) {
      toast.error(`还有 ${aoyinQuestions.length - answered} 题未作答`)
      return
    }

    setAoyinSubmitted(true)
    const correct = aoyinQuestions.filter((q, i) => aoyinAnswers[i] === q.correctIndex).length
    const pct = correct / aoyinQuestions.length
    const passed = pct >= PASS_THRESHOLD

    setAoyinResult({ correct, total: aoyinQuestions.length, passed })

    const wrongDetails = aoyinQuestions
      .filter((q, i) => aoyinAnswers[i] !== q.correctIndex)
      .map((q, i) => ({ question: q.question, picked: q.options[aoyinAnswers[Object.keys(aoyinAnswers)[i]]] || '未作答', correct: q.options[q.correctIndex] }))
    supabase.from('exam_attempts').insert({ email, username, stage: 'aoyin', passed, correct_count: correct, total_count: aoyinQuestions.length, wrong_details: wrongDetails }).then()

    if (passed) {
      toast.success(`敖尹考试通过！正在创建账户...`)
      setTimeout(async () => {
        await createAccount()
        if (inviteRequired) supabase.rpc('increment_invite_usage', { _code: inviteCode.trim().toUpperCase() }).then()
        window.location.href = '/discussion'
      }, 1000)
    } else {
      localStorage.setItem(COOLDOWN_KEY, String(Date.now() + COOLDOWN_MINUTES * 60000))
      toast.error(`敖尹考试未通过（${correct}/${aoyinQuestions.length}），请 ${COOLDOWN_MINUTES} 分钟后再试`)
    }
  }

  /** 创建 Supabase Auth 账户 + profile */
  async function createAccount() {
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    if (data.user) {
      // 后台异步创建 profile，不阻塞
      supabase.from('profiles').upsert({
        id: data.user.id, username, display_name: username,
        exam_passed_at: new Date().toISOString(), exam_attempts: 1,
      }).then(({ error }) => {
        if (error) console.error('profile 创建失败（触发器中处理）:', error.message)
      })
    }
    setLoading(false)
  }

  // ---- 渲染函数 ----

  /** 渲染考试阶段 */
  function renderExamStage(title, subtitle, questions, answers, submitted, result, stage, onSubmit) {
    const answeredCount = Object.keys(answers).length
    const progressPct = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0

    if (loading) {
      return (
        <div className="min-h-screen bg-primary flex items-center justify-center px-4">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-secondary">正在创建账户...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-primary flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* 阶段标题 */}
          <div className="text-center mb-6">
            <h1 className="font-display text-accent text-2xl mb-1">{title}</h1>
            <p className="text-muted text-sm">{subtitle}</p>
          </div>

          {/* 进度条 */}
          {!submitted && (
            <div className="bg-surface rounded-card shadow-card p-4 mb-4">
              <div className="flex items-center justify-between text-xs text-muted mb-2">
                <span>答题进度</span>
                <span>{answeredCount} / {questions.length}</span>
              </div>
              <div className="w-full h-2 bg-hover rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* 考题列表 */}
          <div className="bg-surface rounded-card shadow-card p-6 mb-4">
            {questions.map((q, i) => (
              <ExamQuestion
                key={i}
                question={q}
                index={i}
                selectedAnswer={answers[i]}
                onSelect={(qi, oi) => handleAnswer(stage, qi, oi)}
                locked={answers[i] !== undefined}
              />
            ))}
          </div>

          {/* 结果展示 */}
          {submitted && result && (
            <div className={`rounded-card shadow-card p-6 mb-4 text-center ${
              result.passed ? 'bg-success/10 border border-success' : 'bg-danger/10 border border-danger'
            }`}>
              {result.passed ? (
                <>
                  <CheckCircle size={40} className="text-success mx-auto mb-2" />
                  <p className="text-success font-display text-lg">
                    通过！({result.correct}/{result.total} 正确，{(result.correct / result.total * 100).toFixed(0)}%)
                  </p>
                </>
              ) : (
                <>
                  <XCircle size={40} className="text-danger mx-auto mb-2" />
                  <p className="text-danger font-display text-lg">
                    未通过（{result.correct}/{result.total} 正确，需 ≥ {PASS_THRESHOLD * 100}%）
                  </p>
                  <p className="text-muted text-sm mt-2">
                    24 小时内不可重试，请复习后再次尝试
                  </p>
                  <Link
                    to="/register"
                    className="inline-block mt-4 text-accent text-sm hover:underline"
                    onClick={() => {
                      setStep('form')
                      setRulesSubmitted(false)
                      setAoyinSubmitted(false)
                      setRulesResult(null)
                      setAoyinResult(null)
                    }}
                  >
                    返回注册页
                  </Link>
                </>
              )}
            </div>
          )}

          {/* 提交按钮 */}
          {!submitted && (
            <button
              onClick={onSubmit}
              disabled={answeredCount < questions.length}
              className="w-full bg-accent text-text-inverse rounded-button py-3 font-medium text-sm hover:opacity-90 disabled:opacity-40 transition-all"
            >
              {answeredCount < questions.length
                ? `请先答完所有题目（${answeredCount}/${questions.length}）`
                : '提交答案'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ---- 根据 step 渲染 ----

  // 第一阶段：公约考试
  if (step === 'rules_exam') {
    return renderExamStage(
      '📜 第一阶段：社区文明公约考试',
      `从题库随机抽取 ${QUESTIONS_PER_STAGE} 题，需答对 ≥ ${PASS_THRESHOLD * 100}% 才能进入下一阶段`,
      rulesQuestions, rulesAnswers, rulesSubmitted, rulesResult,
      'rules', submitRulesExam
    )
  }

  // 第二阶段：敖尹考试
  if (step === 'aoyin_exam') {
    return renderExamStage(
      '🐺 第二阶段：敖尹个人知识考试',
      `从题库随机抽取 ${QUESTIONS_PER_STAGE} 题，需答对 ≥ ${PASS_THRESHOLD * 100}% 才能通过注册`,
      aoyinQuestions, aoyinAnswers, aoyinSubmitted, aoyinResult,
      'aoyin', submitAoyinExam
    )
  }

  // 注册表单
  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-accent text-2xl text-center mb-2">
          加入 ValkoValley
        </h1>
        <p className="text-muted text-sm text-center mb-6">
          通过入站考试，成为敖尹社区的一员
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); startExam() }}
          className="bg-surface rounded-card shadow-elevated p-6 space-y-4"
        >
          {/* 邮箱 */}
          <div>
            <label className="text-secondary text-sm font-medium mb-1 block">邮箱</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com" required
              className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* 用户名 */}
          <div>
            <label className="text-secondary text-sm font-medium mb-1 block">用户名</label>
            <input
              type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="2-30 个字符" required minLength={2} maxLength={30}
              className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* 邀请码（开关开启时显示） */}
          {inviteRequired && (
            <div>
              <label className="text-secondary text-sm font-medium mb-1 block">邀请码</label>
              <input
                type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
                placeholder="输入邀请码" required
                className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          )}

          {/* 密码 */}
          <div>
            <label className="text-secondary text-sm font-medium mb-1 block">密码</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位" required minLength={6}
              className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* 用户协议 */}
          <UserAgreement agreed={agreed} onAgreeChange={setAgreed} />

          {/* 提交按钮 */}
          <button
            type="submit"
            className="w-full bg-accent text-text-inverse rounded-button py-2.5 font-medium text-sm hover:opacity-90 transition-opacity"
          >
            开始入站考试
          </button>
        </form>

        <p className="text-muted text-sm text-center mt-4">
          已有账号？{' '}
          <Link to="/login" className="text-accent no-underline hover:underline">
            去登录
          </Link>
        </p>

        <div className="mt-6 bg-warning/10 border border-warning/30 rounded-card p-4">
          <p className="text-warning text-xs flex items-start gap-2">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>
              入站考试分为两阶段：社区公约考试和敖尹知识考试。每阶段随机抽取 {QUESTIONS_PER_STAGE} 题，
              需答对 ≥ {PASS_THRESHOLD * 100}%（{Math.ceil(QUESTIONS_PER_STAGE * PASS_THRESHOLD)} 题）才能通过。
              未通过需等待 24 小时后重试。
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
