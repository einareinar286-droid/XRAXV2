// 云端模式构建入口：加载 .env（含 UNI_CLOUD_PROVIDER / VITE_XR_DUTY_MODE）后执行 uni build
// .env 不入库（gitignore），真实密钥只存本地
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const envFile = '.env'
if (!existsSync(envFile)) {
  console.error('[build:cloud] 缺少 .env 文件。请复制 .env.example 并填入服务空间配置后重试。')
  process.exit(1)
}

for (const line of readFileSync(envFile, 'utf-8').split(/\r?\n/)) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq <= 0) continue
  const key = trimmed.slice(0, eq).trim()
  const value = trimmed.slice(eq + 1).trim()
  if (key) process.env[key] = value
}

const result = spawnSync('uni', ['build', '-p', 'mp-weixin'], { stdio: 'inherit', shell: true, env: process.env })
process.exit(result.status ?? 1)
