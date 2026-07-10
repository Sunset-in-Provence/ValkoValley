/**
 * 设备指纹 — 用于封禁设备
 */
export function getDeviceId() {
  const stored = localStorage.getItem('vv-device-id')
  if (stored) return stored

  // 生成随机设备ID并持久化
  const id = 'D' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  localStorage.setItem('vv-device-id', id)
  return id
}

export async function isDeviceBanned(supabase) {
  try {
    const deviceId = getDeviceId()
    const { data } = await supabase.from('banned_devices').select('id').eq('device_id', deviceId).maybeSingle()
    return !!data
  } catch { return false }
}

export async function banDevice(supabase, deviceId, userId) {
  const { error } = await supabase.from('banned_devices').insert({
    device_id: deviceId, banned_by: userId, reason: '管理员封禁'
  })
  return !error
}
