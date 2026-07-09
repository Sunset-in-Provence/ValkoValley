/**
 * 讨论区帖子数据 Hook
 * 完整实现在 Phase 3
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function usePosts() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('posts')
        .select('*, author:profiles(username, display_name, avatar_url)')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (!error && data) setPosts(data)
      setLoading(false)
    }
    fetch()
  }, [])

  return { posts, loading, refetch: () => {} }
}
