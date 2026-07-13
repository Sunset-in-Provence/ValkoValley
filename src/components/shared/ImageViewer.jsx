import { useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export default function ImageViewer({ images, current, onClose, onPrev, onNext }) {
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft') onPrev()
    if (e.key === 'ArrowRight') onNext()
  }, [onClose, onPrev, onNext])

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [handleKey])

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white z-10"><X size={28} /></button>
      <div className="text-white/50 text-sm absolute top-4 left-4">{current + 1} / {images.length}</div>

      {images.length > 1 && (
        <button onClick={(e) => { e.stopPropagation(); onPrev() }}
          className="absolute left-2 sm:left-4 text-white/70 hover:text-white z-10 p-2">
          <ChevronLeft size={36} />
        </button>
      )}

      <img src={images[current]} alt="" className="max-w-[90vw] max-h-[90vh] object-contain select-none"
        onClick={(e) => e.stopPropagation()} />

      {images.length > 1 && (
        <button onClick={(e) => { e.stopPropagation(); onNext() }}
          className="absolute right-2 sm:right-4 text-white/70 hover:text-white z-10 p-2">
          <ChevronRight size={36} />
        </button>
      )}
    </div>
  )
}
