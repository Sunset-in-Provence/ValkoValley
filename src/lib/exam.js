/**
 * 入站考试工具函数
 */
import { supabase } from './supabaseClient'
import examQuestions from './examQuestions'

const QUESTIONS_PER_STAGE = 10
const PASS_THRESHOLD = 0.8
const COOLDOWN_HOURS = 24

/**
 * 从题库中随机抽取不重复题目
 */
export function pickQuestions(pool, count = QUESTIONS_PER_STAGE) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

/**
 * 获取分离的题库
 */
export function getQuestionPools() {
  return {
    rules: examQuestions.filter((q) => q.category === 'rules'),
    aoyin: examQuestions.filter((q) => q.category === 'aoyin'),
  }
}

/**
 * 计算考试结果
 */
export function gradeExam(questions, answers) {
  const correct = questions.filter((q, i) => answers[i] === q.correctIndex).length
  const total = questions.length
  const percentage = total > 0 ? correct / total : 0
  return {
    correct,
    total,
    percentage,
    passed: percentage >= PASS_THRESHOLD,
  }
}

/**
 * 检查用户是否处于考试冷却期
 * @param {string} userId - 用户 ID
 * @returns {Promise<{canTake: boolean, cooldownEnds: Date|null, attempts: number}>}
 */
export async function checkExamCooldown(userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('last_exam_at, exam_attempts')
    .eq('id', userId)
    .single()

  if (!profile || !profile.last_exam_at) {
    return { canTake: true, cooldownEnds: null, attempts: 0 }
  }

  const lastExam = new Date(profile.last_exam_at)
  const cooldownEnds = new Date(lastExam.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000)
  const now = new Date()
  const canTake = now >= cooldownEnds

  return {
    canTake,
    cooldownEnds: canTake ? null : cooldownEnds,
    attempts: profile.exam_attempts || 0,
  }
}

/**
 * 记录考试尝试（考试失败时调用）
 * @param {string} userId - 用户 ID
 */
export async function recordExamAttempt(userId) {
  // 先获取当前 attempts 值
  const { data } = await supabase
    .from('profiles')
    .select('exam_attempts')
    .eq('id', userId)
    .single()

  const currentAttempts = data?.exam_attempts || 0

  await supabase
    .from('profiles')
    .update({
      last_exam_at: new Date().toISOString(),
      exam_attempts: currentAttempts + 1,
    })
    .eq('id', userId)
}

/**
 * 获取剩余冷却时间（人类可读格式）
 */
export function formatCooldown(cooldownEnds) {
  if (!cooldownEnds) return ''
  const now = new Date()
  const diff = cooldownEnds.getTime() - now.getTime()
  const hours = Math.ceil(diff / (1000 * 60 * 60))
  if (hours <= 0) return '冷却已结束'
  return `${hours} 小时`
}

export { QUESTIONS_PER_STAGE, PASS_THRESHOLD, COOLDOWN_HOURS }
