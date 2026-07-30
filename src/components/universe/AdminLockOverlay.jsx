import { Lock } from 'lucide-react'
import StarBackground from './StarBackground'

export default function AdminLockOverlay() {
  return (
    <div className="relative min-h-screen bg-[#0A0E1A] overflow-hidden flex items-center justify-center">
      {/* 星空背景 */}
      <StarBackground />

      {/* 锁定内容 */}
      <div className="relative z-10 text-center px-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
          <Lock size={36} className="text-white/60" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-white mb-3 tracking-wide">
          敬请期待
        </h1>
        <p className="text-white/50 text-base sm:text-lg leading-relaxed">
          敖尹宇宙共创企划即将开启
        </p>
        <p className="text-white/25 text-sm mt-4">
          管理员正在筹备中……
        </p>
      </div>
    </div>
  )
}
