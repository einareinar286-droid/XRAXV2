# M3 本地数据基础能力实施计划

> **给实施者：** 必须使用 `superpowers:executing-plans`，逐项执行并在每个检查点停下复核。

**目标：** 在不导入、不上传任何真实人员、隐患或附件数据的前提下，完成真实数据一期的本地基础能力：花名册导入预检、统一履职查看范围、全员履职仪表盘读模型和受控的简易操作日志。Cloudflare 仍仅承载匿名 Mock。

**分期边界：** 本计划是 M3A。M3B 才接入私有部署、真实手机号登录、密码散列、正式库表、真实数据导入与上线验收；M3B 开始前必须再次由 EE 确认部署环境和导入窗口。

**架构：** `纯领域规则 -> Mock/未来私有服务适配器 -> 页面服务契约 -> Vue 页面`。预检接收已解析的行对象，不在前端解析或上传 XLSX；后端替换时复用同一领域规则和契约。所有统计以任务记录与人员主数据为输入，禁止为“好看”补造数字。

**技术栈：** ES Modules、Vue 3 / uni-app、Node 内置测试运行器；不增加运行时依赖，不写入真实 Excel，也不调用 Cloudflare。

## 交付和验收口径

- 普通员工和市场员工只能读取、提交自己的履职；安全监察部和超级管理员可看全公司仪表盘、人员明细、审核/考核清单和操作日志。
- 履职率固定为 `按期审核通过 / 应履职`，目标值为 100%；没有“良好”状态；待提交、待审核、退回和逾期均进入待办或考核口径。
- 每位人员的稳定业务主键为 `employeeId`；手机号只作规范化匹配与未来登录入口。无效或重复手机号进入 `PENDING_VERIFICATION`，不得登录。
- 操作日志只记录时间、操作者、部门、操作类型、目标、结果和简短备注；不记录密码、会话凭证、完整附件 URL 或完整正文。
- `pnpm test`、`pnpm run build:h5`、`pnpm run build:mp-weixin`、`git diff --check` 全部通过；测试数据匿名化。

## 实施步骤

### 1. 建立人员导入预检领域内核（先写失败测试）

**文件：**
- 新建：`src/domain/personnel/import-preflight.mjs`
- 新建：`tests/personnel/import-preflight.test.mjs`

**实现：**

1. 编写失败测试：部门空白向下继承；空姓名、无岗位、无部门标记为待复核；大陆手机号统一为 11 位数字；非手机号、重复手机号、同手机号对应不同人员均标记为 `PENDING_VERIFICATION`；每条合法记录生成稳定的 `employeeId`。
2. 实现 `normalizePhone(value)`、`fillDownDepartment(rows)`、`createEmployeeId(row, ordinal)` 与 `buildImportPreflight(rows)`。返回：

   ```js
   {
     accepted: [{ employeeId, displayName, department, position, phone, accountStatus }],
     reviewItems: [{ sourceRow, reasonCodes, suggestedDepartment }],
     summary: { sourceCount, acceptedCount, pendingVerificationCount, invalidCount }
   }
   ```

3. `employeeId` 使用导入批次内不可变的行序号加校验前缀生成；不得使用姓名或手机号拼接为主键。
4. 测试仅使用虚构姓名、部门和 `1380000xxxx` 示例号码。预检模块不得读文件、不得网络请求、不得输出人员明细到日志。

**检查点：** `node --test tests/personnel/import-preflight.test.mjs` 通过，所有异常均落在 `reviewItems`，不会被静默丢弃。

### 2. 统一履职权限范围并纠正现有 Mock 口径（先写失败测试）

**文件：**
- 新建：`src/domain/duties/access-policy.mjs`
- 新建：`tests/duties/access-policy.test.mjs`
- 修改：`src/services/duties/mock-adapter.mjs`
- 修改：`src/services/duties/index.mjs`
- 修改：`tests/duties/mock-adapter.test.mjs`

**实现：**

1. 暴露 `canViewCompanyDutyDashboard(user)`、`canViewDutyPeople(user)`、`canReviewDuty(user)`、`canViewOperationLogs(user)` 与 `canAccessOwnDuty(user, duty)`。
2. 规则固定为：`SUPER_ADMIN`、`SAFETY_OFFICER` 拥有公司级查看、审核与日志读取；`EMPLOYEE`、`MARKETING_OFFICER` 只能访问本人履职。市场角色不再因“部门”获得全市场履职查看权限。
3. 让 `mock-adapter` 仅通过该策略决定返回范围和审核资格，不在页面层依据角色裁剪数据。保留现有 Mock 角色切换能力，但它仍只可供本地超级管理员演示。
4. 给现有服务增加只读入口：`listDutyPeople(filters)` 与 `getDutyDashboard(filters)`；未授权时返回统一的权限错误，不返回已裁剪的公司数据来掩盖越权。

**检查点：** 新增测试证明安全监察和超级管理员可看跨部门数据，普通/市场用户只能拿到本人数据，并证明客户端传入伪造角色不能扩大权限。

### 3. 扩展真实口径的履职仪表盘读模型（先写失败测试）

**文件：**
- 修改：`src/domain/duties/metrics.mjs`
- 新建：`src/domain/duties/dashboard.mjs`
- 新建：`tests/duties/dashboard.test.mjs`
- 修改：`src/services/duties/mock-adapter.mjs`

**实现：**

1. 基于任务集合、人员集合和统计周期实现 `createDutyDashboard({ duties, employees, period })`，不把展示数字写死在页面。
2. 输出公司总览、部门汇总、人员明细、待审核清单与考核清单。每个指标都返回分子、分母或对应任务 ID 列表，以便页面可追溯。
3. 人员明细至少含 `employeeId`、展示姓名、部门、岗位、应履职、按期审核通过、待提交、待审核、退回、逾期、考核状态与履职率。没有任务的人员标记 `NOT_APPLICABLE`，不进入履职率分母。
4. 考核条件由现有规则统一生成：未提交、待审核超期、退回未重提、逾期提交均进入考核；不得产生“良好”或主观评级字段。

**检查点：** 测试分别覆盖 100%、低于 100%、无适用任务、退回、逾期和跨部门汇总。所有汇总值等于人员明细聚合值。

### 4. 建立可脱敏的简易操作日志领域与 Mock 存储（先写失败测试）

**文件：**
- 新建：`src/domain/operation-logs/record.mjs`
- 新建：`src/services/operation-logs/mock-adapter.mjs`
- 新建：`src/services/operation-logs/index.mjs`
- 新建：`tests/operation-logs/mock-adapter.test.mjs`

**实现：**

1. 定义操作枚举：`DUTY_SUBMIT`、`DUTY_APPROVE`、`DUTY_RETURN`、`ISSUE_REPORT`、`ISSUE_ASSIGN`、`ISSUE_RECTIFY`、`ISSUE_CLOSE`、`ISSUE_REOPEN`、`IMPORT_PREVIEW`、`IMPORT_CONFIRM`、`LOGIN_SUCCESS`、`LOGIN_FAILURE`。
2. `createOperationLogRecord(input)` 只接受白名单字段，输出 `{ id, occurredAt, actorId, actorName, actorDepartment, action, targetType, targetId, result, note }`。备注截断并剔除疑似 token、密码字段、URL 和长正文。
3. Mock 适配器提供 `append(record)` 与 `list({ page, pageSize, action, actorId, dateRange }, viewer)`；先走 `canViewOperationLogs(viewer)`，再返回倒序分页结果。普通和市场用户读取日志必须失败。
4. 服务入口只暴露 `listOperationLogs(filters)`；写日志只能由服务适配器内部调用，页面不得直接伪造操作者或结果。

**检查点：** 测试证明日志字段脱敏、权限拒绝、筛选分页和按时间倒序正确；敏感键名、完整 URL 和超长正文不进入记录。

### 5. 把履职和隐患关键动作接入日志，并保持事务失败不留成功日志（先写失败测试）

**文件：**
- 修改：`src/services/duties/mock-adapter.mjs`
- 修改：`src/services/issues/mock-adapter.mjs`
- 修改：`tests/duties/mock-adapter.test.mjs`
- 修改：`tests/issues/mock-adapter.test.mjs`

**实现：**

1. 为两个 Mock 适配器增加可注入的 `operationLog` 端口；默认使用第 4 步的内存端口，测试使用隔离实例。
2. 仅在领域操作成功、版本校验通过且数据实际写入后追加日志。失败、越权、冲突和校验错误返回错误但不产生“成功”日志。
3. 履职动作记录当前会话的可信操作者和任务 ID；隐患动作记录上报、交办、市场整改、安监闭环与重开。日志备注只放状态变化摘要，例如“待审核 -> 已通过”。
4. 保持问题/履职服务的现有返回契约，日志不可反向影响主流程；日志写入故障应显式报告并在未来私有后端采用同事务写入，而不是悄悄吞掉。

**检查点：** 现有状态机测试继续通过；新增断言保证每次成功状态变更恰有一条正确日志，失败路径零成功日志。

### 6. 接入管理员仪表盘、人员明细和日志页面（先写页面契约测试）

**文件：**
- 修改：`src/pages/admin/duty.vue`
- 新建：`src/pages/admin/operation-logs.vue`
- 修改：`src/pages/profile/index.vue`
- 修改：`src/pages.json`
- 视实现需要修改：`src/components/navigation/AdaptiveNavigation.vue`
- 新建或修改：`tests/navigation/*.test.mjs`、`tests/duties/service-contract.test.mjs`

**实现：**

1. 管理员履职页按“总览 / 部门 / 人员 / 待审核 / 考核”组织。首屏放 100% 目标、当前履职率、未完成数、待审核数、逾期/考核数；任何没有服务数据的区域显示“暂无真实数据”，不得显示编造数字。
2. 人员表支持周期、部门、状态筛选和关键词查找；点击行可进入只读的个人履职明细。普通和市场角色不能通过路由参数绕过此页。
3. 新增只读“操作日志”页，仅对安全监察和超级管理员在“我的”页/宽屏导航显示入口。日志页展示时间、操作人、部门、操作、对象、结果、备注，并支持日期、操作类型、人员筛选及分页。
4. 统一使用服务层返回的 `viewer` 权限和读模型。UI 只做状态展示，不以隐藏按钮作为权限边界。
5. 所有新中文文案符合“履职必须 100%，未完成进入考核”的口径；将 Mock 标识保留在测试站点，真实数据前不伪装为生产系统。

**检查点：** 管理员可见完整仪表盘/日志入口；普通和市场用户没有入口且直接访问受拒；375px 移动端和 1280px H5 不横向溢出。

### 7. 完整验证、文档收口与分支提交

**文件：**
- 修改：`docs/开发日志.md`
- 视需要修改：`README.md` 或 `docs/superpowers/specs/2026-08-04-real-data-phase-1-design.md`

**实现：**

1. 在开发日志记录 M3A 完成项、验证结果、未触及真实数据的证据和下一步 M3B 前置条件；不记录花名册明细、手机号或密码。
2. 执行：

   ```powershell
   pnpm test
   pnpm run build:h5
   pnpm run build:mp-weixin
   git diff --check
   ```

3. 检查 `git status --short` 与暂存差异，确认没有 `.env`、XLSX、真实手机号、token、私钥、附件或构建产物。
4. 在 `feature/leader-workbench` 提交功能与测试，使用 EE 已授权 GitHub 凭据和本地代理推送该分支。推送前说明 Cloudflare 不更新为真实数据站。

**检查点：** 全部门禁通过，GitHub 仅包含代码、匿名测试和文档；M3B 仍保持未部署/未导入状态。

## M3B 交接条件（本计划不执行）

1. EE 确认私有部署目标（火山引擎或其他受控环境）、管理员边界、备份与日志保留周期。
2. 在私有环境实现手机号密码认证、密码散列、受控会话、服务端 RBAC、员工/履职/日志表及审计写入。
3. 由 EE 本地运行预检，人工处理 `PENDING_VERIFICATION` 清单；通过后在私有环境导入，保留回滚快照和导入审计。
4. 在不含敏感数据的 Cloudflare 环境只保留演示构建；真实环境完成账号、权限、导入、备份、恢复和离线验收后才允许上线。
