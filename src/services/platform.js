export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    uni.getLocation({
      type: 'gcj02',
      success: resolve,
      fail: reject
    })
  })
}

export function chooseMapLocation() {
  return new Promise((resolve, reject) => {
    uni.chooseLocation({ success: resolve, fail: reject })
  })
}

export function chooseEvidenceImages() {
  return new Promise((resolve, reject) => {
    uni.chooseImage({ count: 6, sizeType: ['compressed'], sourceType: ['album', 'camera'], success: resolve, fail: reject })
  })
}

// 生产环境仅向自建云函数上传，AI 服务密钥保存在云端环境变量中，绝不写入小程序。
export async function requestAiReview() {
  return { supported: false, message: '演示版未接入 AI。生产版将由云函数调用受控 AI 审核接口。' }
}
