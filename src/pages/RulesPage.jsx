import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/**
 * UI 变量映射：bg-primary, bg-surface, text-primary, text-secondary, text-accent,
 *   rounded-card, shadow-card, font-display, font-body
 */
export default function RulesPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-primary">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 bg-surface rounded-button px-3 py-1.5 text-muted text-sm mb-4 hover:text-accent transition-colors shadow-card">
          <ArrowLeft size={16} /> 返回
        </button>
        <div className="bg-surface rounded-card shadow-card p-8">
          <h1 className="font-display text-accent text-2xl mb-6">ValkoValley 社区公约</h1>
          <div className="prose text-secondary font-body text-sm leading-relaxed space-y-4">
            <section>
              <h2 className="font-display text-accent text-lg mt-6 mb-3">一、总则</h2>
              <p>ValkoValley（以下简称"本站"）是敖尹 CP 同好交流与创作社区。所有用户在注册时已通过入站考试，表明已阅读并同意本公约。请共同维护友善、尊重的社区氛围。</p>
            </section>
            <section>
              <h2 className="font-display text-accent text-lg mt-6 mb-3">二、文明发言</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>禁止人身攻击、辱骂、恶意引战。</li>
                <li>禁止歧视性言论（种族、性别、性取向、地域等）。</li>
                <li>理性讨论，求同存异。对不同观点保持尊重。</li>
              </ul>
            </section>
            <section>
              <h2 className="font-display text-accent text-lg mt-6 mb-3">三、版权与创作</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>禁止未经授权转载、盗图、抄袭他人作品。</li>
                <li>转载内容须标明出处并获得原作者许可。</li>
                <li>创作区发布内容须选择正确的类型（文/图/视频）。</li>
              </ul>
            </section>
            <section>
              <h2 className="font-display text-accent text-lg mt-6 mb-3">四、禁止内容</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>严禁发布任何形式的色情、淫秽、低俗、性暗示内容。</li>
                <li>严禁发布封建迷信、玄学占卜、算命风水等内容。</li>
                <li>严禁发布任何违反中华人民共和国法律法规的内容。</li>
                <li>以上违规行为一经发现，永久封禁，不予申诉。</li>
              </ul>
            </section>
            <section>
              <h2 className="font-display text-accent text-lg mt-6 mb-3">五、隐私与安全</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>禁止公开他人隐私信息（真实姓名、联系方式、照片等）。</li>
                <li>禁止发布违法内容、恶意链接、钓鱼信息。</li>
                <li>发现违规内容，请使用举报功能告知管理员。</li>
              </ul>
            </section>
            <section>
              <h2 className="font-display text-accent text-lg mt-6 mb-3">六、处罚措施</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>轻微违规：警告通知 + 内容删除。</li>
                <li>严重违规：封禁账户（1天/7天/30天/永久）+ 违规永久公示。</li>
                <li>多次违规：永久封禁。</li>
              </ul>
            </section>
            <p className="text-muted text-xs mt-8">本公约由 ValkoValley 管理团队维护，保留最终解释权。如有疑问请联系管理员。</p>
          </div>
        </div>
      </div>
    </div>
  )
}
