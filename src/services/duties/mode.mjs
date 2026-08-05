// 履职数据模式开关：Mock 默认（决策 4）；云模式需显式开启 VITE_XR_DUTY_MODE=cloud
export function isCloudDutyMode(env = import.meta.env || {}) {
  return env.VITE_XR_DUTY_MODE === 'cloud'
}

export function isMockDutyMode(env = import.meta.env || {}) {
  return !isCloudDutyMode(env)
}
