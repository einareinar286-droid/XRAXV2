# uniCloud 云适配器接线方案书（M3C · 履职模块云端化）

> 状态：**方案评审中**（EE 未批准实施）
> 日期：2026-08-05
> 给实施者：本方案经 EE 确认后才可动代码；动代码时使用 `superpowers:executing-plans`，逐项执行并复核。

## 一、背景与目标

uniCloud 阿里云服务空间 `xraxbeta1` 已就绪：`duty-service` 云对象 + 4 张 schema（templates/assignments/instances/audit）+ `uni-id-common` 已部署上线。小程序前端目前**全走 Mock**（`src/services/duties/index.mjs` 硬编码 `isMockDutyMode = true`），页面不调云端。

**目标：** 将履职模块（`pages/duty/*`、`pages/admin/duty.vue`、`profile` 中履职相关入口）从 Mock 切换到云端，Mock/云可切换，页面契约零改动（沿用本项目既有红线：页面只消费服务返回字段）。

## 二、现状差距清单（已核对，证据在代码）

### 2.1 接口缺口：云端方法 ≠ 前端页面所需

| 前端页面消费（mock-adapter 提供） | 云端 duty-service 现状 | 差距 |
|---|---|---|
| `getCurrentUser()` | ❌ 无 | 前端需从会话取当前用户 |
| `listMyDuties()` | `myInstances({status,category})` | 方法名/参数/返回形状不同 |
| `submitDuty(id, {note,attachments})` | `submitInstance({instanceId,description,files})` | 命名与字段不同 |
| `reviewDuty(id, {decision,note})`（审核通过/退回） | ❌ 无 | **云端无审核能力** |
| `getDutyDashboard({asOf,periodType})`（公司/部门聚合） | ❌ 无 | **云端无仪表盘聚合** |
| `listDutyPeople({department,status,keyword,periodType})` | `adminInstances(...)` 近似 | 无人员维度聚合 |
| `setMockRole(role)` | ❌ 无 | Mock 专用，云端不需要 |

### 2.2 状态机不一致

| 维度 | 云端 | 前端 |
|---|---|---|
| 实例状态 | `PENDING / OVERDUE / DONE` | `PENDING / SUBMITTED / APPROVED / RETURNED` |
| 提交动作 | 提交即 `DONE`（锁定周期） | 提交 → `SUBMITTED` → 审核后 `APPROVED/RETURNED` |

前端有"退回重提"流程（`RETURNED` → 重新提交），云端 `submitInstance` 对 `DONE` 直接抛 `PERIOD_ALREADY_LOCKED`——**语义不兼容**。

### 2.3 模型差异

- 云端：`xr-duty-assignments`（周期分配：谁、做什么、什么频率）→ `_timing` 定时生成 `xr-duty-instances`（周期实例）。
- 前端：`mock-data.mjs` seed 的任务卡（task），含 `periodType/cycleStart/cycleEnd/cycleKey` 字段，按 `ownerUid === currentUser.uid` 校验填报人。
- **Schema 字段对不上**：`instances` 表有 `assignmentId/actionName/category/frequency/periodStart/periodEnd/dueDate/status/description/files/completedAt`，但前端任务还消费 `title/periodType/cycleKey/evidence.note/review.note` 等字段——**instances schema 需要增补字段**（见 4.3）。

### 2.4 硬前置：登录

`duty-service/_before()` 无条件 `uniId.checkToken(clientInfo.uniIdToken)`，无有效 token 一律 `UNAUTHORIZED`。前端目前无任何登录入口 → **接线前必须先打通 uni-id 登录闭环**，否则云适配器一个请求都发不出去。

### 2.5 权限模型

- 云端 `_before` 只取 `token.role`，`isAdmin()` 检查 `roles.includes('SAFETY_ADMIN')`。
- 前端 Mock 权限：`SUPER_ADMIN`/`SAFETY_OFFICER` 看全员与审核，`MARKETING_OFFICER` 提交整改，`EMPLOYEE` 本人履职。
- **云端 `SAFETY_ADMIN` 角色与前端角色体系不一致**——需对齐角色名映射，或由 uni-id 配置角色。

## 三、分阶段实施计划

> 依赖顺序：登录（P0）→ 云端能力补齐（P1）→ 前端适配器（P2）→ 联调验证（P3）。每阶段独立可交付、可回滚（保持 Mock 可切换）。

### P0：uni-id 登录闭环（前置，必做）

- **内容：** 引入官方 `uni-id-pages`（含登录/注册/退出页面）或自研轻量 `uni-id-co` 云函数；配置 uni-id（token 密钥、角色映射）；`uniCloud-aliyun/database` 补 `uni-id-users` 等 opendb schema；上传部署。
- **交付：** 小程序端能登录/登出，`uni_id_token` 落 storage；`uniCloud.getCurrentUserInfo()` 有 uid/role。
- **测试：** 登录成功/失败、token 校验、角色注入。
- **工作量：** 中（涉及云端函数 + 前端页面 + 配置），需要 EE 提供测试账号或匿名注册开关。

### P1：云端能力补齐（核心工程）

- **内容：** 扩展 `duty-service`（或拆分新云对象），补齐前端所需能力：
  1. `myDuties({periodType})`：本人履职实例列表（对齐前端 task 形状）。
  2. `submitDuty(instanceId, {note, attachments})`：提交 → `SUBMITTED`（不直接 DONE），允许 `RETURNED` 重提。
  3. `reviewDuty(instanceId, {decision, note})`：`APPROVE/RETURN`，写 `xr-duty-audit`。
  4. `dutyDashboard({asOf, periodType})`：公司/部门聚合（按时通过率、考核项、待审核）。
  5. `dutyPeople({department, dutyStatus, keyword, periodType})`：人员维度明细。
- **约束：** 状态机改为 `PENDING/SUBMITTED/APPROVED/RETURNED/OVERDUE`（与前端一致）；`_timing` 生成实例后仍走 `PENDING`；填报人校验 `ownerUid === auth.uid` 保留。
- **测试：** 云端逻辑需抽纯函数 + 本地单测（沿用 `cloud-frequency-alignment` 的契约测试模式）；schema 增补字段（4.3）。
- **工作量：** 大（云端业务逻辑 + schema 演进 + 测试）。

### P2：前端云适配器（接线）

- **内容：** 新增 `src/services/duties/cloud-adapter.mjs`（实现与 mock-adapter 相同的公开接口）；`src/services/duties/index.mjs` 加切换开关（`isMockDutyMode` 由构建配置/环境变量控制，Mock 为默认，云模式需显式开启）；页面零改动。
- **内容补充：** `getCurrentUser` 改为读 uni-id 会话；`setMockRole` 仅 Mock 模式生效。
- **测试：** adapter 接口契约测试（沿用 `service-contract` 模式），Mock/云双模式跑通。
- **工作量：** 中。

### P3：联调验证

- **内容：** 真 AppID 微信开发者工具 → 登录 → 履职列表/填报/审核/仪表盘全链路走云端；Mock 开关切换回归。
- **验收：** `pnpm test` 全绿；`build:h5`/`build:mp-weixin` 通过；真机/工具演示闭环。
- **工作量：** 小（主要是联调与修 bug）。

## 四、风险与决策点（需 EE 拍板）

### 4.1 云端角色体系（决策点）
云端 `_before` 用 `SAFETY_ADMIN`，前端用 `SUPER_ADMIN/SAFETY_OFFICER/MARKETING_OFFICER/EMPLOYEE`。
**建议：** uni-id 角色直接采用前端四角色，云对象 `isAdmin` 改为检查 `SUPER_ADMIN || SAFETY_OFFICER`；`MARKETING_OFFICER` 允许整改提交；其余本人数据。→ 需 EE 确认角色清单与权限边界。

### 4.2 真实账号来源（决策点）
登录后 uid 如何与履职实例 `ownerUid` 对应？
**建议：** P0 用匿名/测试账号（如 `mock-uid-001`）打通链路；真实人员映射（665 花名册 → uni-id 账号）单独立项（M3B 遗留），**红线：不导入真实姓名/手机号**。
→ 需 EE 确认测试账号策略。

### 4.3 Schema 演进（决策点）
`xr-duty-instances` 需增补前端任务字段（如 `title/periodType/cycleKey`），`xr-duty-audit` 需支持审核动作（`APPROVE/RETURN`）。
**影响：** 已部署 schema 需更新重传；`_timing` 生成逻辑同步调整。
→ 需 EE 确认允许改 schema（新增字段，不删既有字段，向后兼容）。

### 4.4 Mock 默认 vs 云默认（决策点）
**建议：** 上线切换前 Mock 保持默认；云模式由显式配置开启（`VITE_XR_DUTY_MODE=cloud`）。避免未验收先切云导致演示环境不可用。
→ 需 EE 确认默认模式策略。

## 五、总体工作量预估

| 阶段 | 内容 | 预估（人天） | 依赖 |
|---|---|---|---|
| P0 | uni-id 登录闭环 | 1–2 | 无 |
| P1 | 云端能力补齐 + schema 演进 | 3–5 | P0 |
| P2 | 前端云适配器 | 1–2 | P1 |
| P3 | 联调验证 | 0.5–1 | P2 |
| **合计** | | **6–10** | |

## 六、验收标准（总）

1. 微信开发者工具（真 AppID）登录 → 履职列表/填报/审核/仪表盘全链路走云端真实数据。
2. Mock/云可切换，切换后页面契约零改动、88+ 项既有测试全绿。
3. 云端 `_timing` 定时生成实例正常；`daily` 周期（已对齐）在云端可生成。
4. `pnpm test`、`build:h5`、`build:mp-weixin`、`git diff --check` 全部通过。
5. 全程匿名数据红线：不导入真实姓名/手机号/附件。
