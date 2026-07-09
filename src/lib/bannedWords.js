/**
 * 违禁词检测工具
 */
const cache = { words: [], loaded: false, loading: null }

export async function loadBannedWords(supabase) {
  if (cache.loaded) return cache.words
  if (cache.loading) return cache.loading

  cache.loading = (async () => {
    const { data } = await supabase.from('banned_words').select('word')
    cache.words = (data || []).map((w) => w.word.toLowerCase())
    cache.loaded = true
    return cache.words
  })()
  return cache.loading
}

/**
 * 检查文本是否包含违禁词，返回命中的违规词数组
 */
export function checkBannedWords(text, wordList) {
  if (!text || !wordList.length) return []
  const lower = text.toLowerCase()
  return wordList.filter((w) => lower.includes(w))
}

/**
 * 清除缓存（管理后台增删违禁词后调用）
 */
export function clearBannedWordsCache() {
  cache.words = []
  cache.loaded = false
  cache.loading = null
}
