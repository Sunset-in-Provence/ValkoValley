import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export default function ScrollToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    function check() {
      // 检测页面最外层滚动
      const y = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop
      setShow(y > 200)
    }
    window.addEventListener('scroll', check, { passive: true })
    check()
    return () => window.removeEventListener('scroll', check)
  }, [])

  if (!show) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-24 right-6 z-50 w-11 h-11 bg-white border border-border rounded-full shadow-lg flex items-center justify-center hover:bg-accent hover:text-white hover:border-accent transition-all"
      title="返回顶部"
    >
      <ArrowUp size={20} />
    </button>
  )
}
