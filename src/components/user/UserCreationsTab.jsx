/**
 * 用户创作列表 Tab
 * UI 变量映射：bg-surface, rounded-card, shadow-card
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import CreationCard from '@/components/creation/CreationCard'
import EmptyState from '@/components/shared/EmptyState'
import { Palette } from 'lucide-react'

export default function UserCreationsTab({ userId }) {
  const [creations, setCreations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('creations')
        .select('*, author:profiles!creations_author_id_fkey(username, display_name, avatar_url)')
        .eq('author_id', userId).eq('is_deleted', false)
        .order('created_at', { ascending: false })
      if (data) { const ids = data.map((c) => c.id); const likeMap = {}; const { data: likes } = await supabase.from('likes').select('target_id').eq('target_type', 'creation').in('target_id', ids); likes?.forEach((l) => { likeMap[l.target_id] = (likeMap[l.target_id] || 0) + 1 }); setCreations(data.map((c) => ({ ...c, like_count: likeMap[c.id] || 0 }))) }
      setLoading(false)
    }
    fetch()
  }, [userId])

  if (loading) return null
  if (creations.length === 0) {
    return <EmptyState icon={Palette} title="暂无创作" description="该用户还没有发布过创作" />
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {creations.map((c) => <CreationCard key={c.id} creation={c} />)}
    </div>
  )
}
