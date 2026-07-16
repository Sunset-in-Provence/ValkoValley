/**
 * 创作区数据 Hook
 * 完整实现在 Phase 4
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function useCreations() {
  const [creations, setCreations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('creations')
        .select('*, author:profiles(username, display_name, avatar_url)')
        .eq('is_deleted', false).neq('hidden', true)
        .order('created_at', { ascending: false })

      if (!error && data) setCreations(data)
      setLoading(false)
    }
    fetch()
  }, [])

  return { creations, loading, refetch: () => {} }
}
