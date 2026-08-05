// 云端履职适配器：与 mock-adapter 同接口，内部调用 duty-service 云对象。
// 字段映射：云端 instance(_id/periodStart/periodEnd) → 前端 task(id/cycleStart/cycleEnd)
// 依赖注入 importObject 便于测试；真实环境默认 uniCloud.importObject。

export function mapInstanceToTask(instance) {
  if (!instance) return instance
  const { _id, periodStart, periodEnd, ...rest } = instance
  return {
    ...rest,
    id: _id,
    cycleStart: periodStart,
    cycleEnd: periodEnd
  }
}

export function mapDashboard(cloud) {
  return {
    company: cloud?.company || {},
    departments: cloud?.departments || [],
    people: cloud?.people || [],
    reviewItems: (cloud?.reviewItems || []).map(mapInstanceToTask),
    assessmentItems: (cloud?.assessmentItems || []).map(mapInstanceToTask)
  }
}

// UNAUTHORIZED 时引导重新登录（token 过期/失效统一处理）
function handleAuthError(err) {
  const message = err?.message || String(err)
  if (message.includes('UNAUTHORIZED') || err?.code === 'UNAUTHORIZED') {
    uni.removeStorageSync('uni_id_token')
    setTimeout(() => {
      uni.showModal({
        title: '登录已过期',
        content: '请重新登录后继续操作',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) uni.navigateTo({ url: '/pages/login/index' })
        }
      })
    }, 0)
  }
  throw err
}

export function createCloudDutyAdapter({ importObject } = {}) {
  function getObject() {
    if (importObject) return importObject('duty-service')
    return uniCloud.importObject('duty-service')
  }

  async function getCurrentUser() {
    const auth = uniCloud.importObject('auth-service')
    return auth.me()
  }

  return {
    setMockRole(role) {
      // 云模式无 Mock 身份切换；返回当前云端用户（由 getCurrentUser 决定）
      return null
    },

    async getCurrentUser() {
      return getCurrentUser()
    },

    async listMyDuties(params = {}) {
      try {
        const service = getObject()
        const result = await service.myDuties(params)
        return (result || []).map(mapInstanceToTask)
      } catch (err) { handleAuthError(err) }
    },

    async submitDuty(id, payload) {
      try {
        const service = getObject()
        return service.submitDuty({ instanceId: id, note: payload?.note, attachments: payload?.attachments || [] })
      } catch (err) { handleAuthError(err) }
    },

    async reviewDuty(id, payload) {
      try {
        const service = getObject()
        return service.reviewDuty({ instanceId: id, decision: payload?.decision, note: payload?.note })
      } catch (err) { handleAuthError(err) }
    },

    async getDutyDashboard(params = {}) {
      try {
        const service = getObject()
        const result = await service.dutyDashboard(params)
        return mapDashboard(result)
      } catch (err) { handleAuthError(err) }
    },

    async listDutyPeople(params = {}) {
      try {
        const service = getObject()
        const result = await service.dutyPeople(params)
        return result || []
      } catch (err) { handleAuthError(err) }
    }
  }
}
