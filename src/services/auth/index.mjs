// 云端登录服务：封装 auth-service 云对象调用。
// 云模式（VITE_XR_DUTY_MODE=cloud）下启用；Mock 模式返回未登录。
import { isCloudDutyMode } from '../duties/mode.mjs'

export async function cloudLogin({ username, password }) {
  if (!isCloudDutyMode()) throw Object.assign(new Error('当前为 Mock 演示模式，未启用云端登录'), { code: 'MOCK_MODE' })
  const auth = uniCloud.importObject('auth-service')
  const result = await auth.login({ username, password })
  if (result.errCode !== 0) throw Object.assign(new Error('登录失败'), { code: result.errCode })
  uni.setStorageSync('uni_id_token', result.token)
  uni.setStorageSync('uni_id_token_expired', result.tokenExpired)
  return { uid: result.uid, role: result.role }
}

export async function cloudRegister({ username, password, displayName, department, role = 'EMPLOYEE' }) {
  if (!isCloudDutyMode()) throw Object.assign(new Error('当前为 Mock 演示模式，未启用云端登录'), { code: 'MOCK_MODE' })
  const auth = uniCloud.importObject('auth-service')
  const result = await auth.register({ username, password, displayName, department, role })
  if (!result || result.ok !== true) throw Object.assign(new Error('注册失败'), { code: result?.errCode })
  // 注册成功后自动登录，返回 token
  const loginResult = await auth.login({ username, password })
  if (loginResult.errCode !== 0) throw Object.assign(new Error('注册成功但登录失败'), { code: loginResult.errCode })
  uni.setStorageSync('uni_id_token', loginResult.token)
  uni.setStorageSync('uni_id_token_expired', loginResult.tokenExpired)
  return { uid: loginResult.uid, role: loginResult.role }
}

export async function cloudLogout() {
  try {
    const auth = uniCloud.importObject('auth-service')
    await auth.logout()
  } catch {
    // 忽略登出云端失败，本地 token 必须清
  }
  uni.removeStorageSync('uni_id_token')
  uni.removeStorageSync('uni_id_token_expired')
}

export async function cloudMe() {
  if (!isCloudDutyMode()) return null
  const auth = uniCloud.importObject('auth-service')
  return auth.me()
}
