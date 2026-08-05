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
      const service = getObject()
      const result = await service.myDuties(params)
      return (result || []).map(mapInstanceToTask)
    },

    async submitDuty(id, payload) {
      const service = getObject()
      return service.submitDuty({ instanceId: id, note: payload?.note, attachments: payload?.attachments || [] })
    },

    async reviewDuty(id, payload) {
      const service = getObject()
      return service.reviewDuty({ instanceId: id, decision: payload?.decision, note: payload?.note })
    },

    async getDutyDashboard(params = {}) {
      const service = getObject()
      const result = await service.dutyDashboard(params)
      return mapDashboard(result)
    },

    async listDutyPeople(params = {}) {
      const service = getObject()
      const result = await service.dutyPeople(params)
      return result || []
    }
  }
}
