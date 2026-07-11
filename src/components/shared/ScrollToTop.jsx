import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export default function ScrollToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    function onScroll() { setShow(window.scrollY > 300) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!show) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-20 right-6 z-40 w-10 h-10 bg-surface border border-border rounded-full shadow-elevated flex items-center justify-center hover:bg-accent hover:text-text-inverse hover:border-accent transition-all"
    >
      <ArrowUp size={18} />
    </button>
  )
}
