# 领导工作台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 XRAXV2 首页升级为明确标识数据状态的领导工作台，并为 H5 宽屏提供左侧导航。

**Architecture:** 新增纯函数工作台汇总模型和服务适配器，一次读取当前角色可见的隐患与履职快照。导航做成可复用组件，仅在 H5 宽屏显示；手机和小程序继续使用底部 TabBar。Mock 身份切换由构建环境标志控制，Cloudflare 默认关闭。

**Tech Stack:** uni-app、Vue 3、Vite、Node test runner、SCSS。

## Global Constraints

- 只在 `feature/leader-workbench` 工作区修改；不覆盖 `XRAXV2` 或旧 `m2-core` 工作区。
- Mock 数字必须显示演示数据状态；未接真实数据时不得表述为公司实际结果。
- 不实现实时资讯、真实登录、人员导入、真实附件或云端部署逻辑。
- H5 宽屏阈值固定为 `1200px`；小程序与手机保留底部导航。
- 每项代码先写失败测试，再写最小实现；每个任务独立提交。

---

### Task 1: 工作台汇总领域模型

**Files:**
- Create: `src/domain/workbench/summary.mjs`
- Create: `tests/workbench/summary.test.mjs`

**Interfaces:** Produces `createWorkbenchSummary({ issues, dutyDashboard, generatedAt, dataMode })`, returning data mode, timestamp, six项隐患指标、三项履职指标和排序待办。

- [x] 写入一个重大待交办、一个已闭环、一个履职考核项的失败测试，断言总数、状态数、重大数、履职率和待办排序。
- [x] 运行 `node --test tests/workbench/summary.test.mjs`，预期模块不存在而失败。
- [x] 实现纯函数：统计 `REPORTED/ASSIGNED/RECTIFICATION_SUBMITTED/CLOSED`、重大项；履职只读取同一快照的 `completionRate/reviewItems/assessmentCount`；排序为重大、待复核、临期、其余。
- [x] 运行 `node --test tests/workbench/summary.test.mjs` 及全量 Node 测试，确认通过。
- [x] 提交：`git commit -m "feat: add leader workbench summary model"`。

### Task 2: 工作台快照服务与 Mock 入口控制

**Files:**
- Create: `src/services/workbench/index.mjs`
- Create: `src/services/mock-mode.mjs`
- Create: `tests/workbench/service-contract.test.mjs`
- Modify: `src/pages/profile/index.vue`

**Interfaces:** `getWorkbenchSnapshot({ generatedAt })` 返回 `{ user, dataMode: 'MOCK', generatedAt, issueMetrics, dutyMetrics, priorityItems }`；`isMockRoleSwitcherEnabled(env)` 只在 `VITE_XR_ENABLE_MOCK_ROLE_SWITCHER === 'true'` 时返回真。

- [x] 写失败测试：默认环境关闭角色切换；显式环境开启；工作台快照包含 `MOCK` 数据状态与隐患指标。
- [x] 运行 `node --test tests/workbench/service-contract.test.mjs`，预期模块不存在而失败。
- [x] 服务一次读取 Issue 列表和当前用户；履职仪表盘无权限时返回 `null` 而非伪造零值；交给领域模型统一汇总。
- [x] Profile 仅在本机构建标志开启且当前角色为 `SUPER_ADMIN` 时渲染 Mock 身份切换区。
- [x] 运行工作台、履职、隐患、会话全量测试并提交：`git commit -m "feat: add workbench snapshot service"`。

### Task 3: 自适应左侧导航

**Files:**
- Create: `src/components/navigation/AdaptiveNavigation.vue`
- Create: `tests/navigation/adaptive-navigation.test.mjs`
- Modify: `src/App.vue`
- Modify: `src/pages.json`
- Modify: `src/pages/index/index.vue`
- Modify: `src/pages/duty/index.vue`
- Modify: `src/pages/issue/create.vue`
- Modify: `src/pages/profile/index.vue`

**Interfaces:** `AdaptiveNavigation` 接收 `active`，取值为 `WORKBENCH/DUTY/REPORT/PROFILE`，用 `uni.switchTab` 跳转四个既有 Tab 路由。

- [x] 写失败组件契约测试，断言四个标签和四个 Tab 路径存在。
- [x] 运行 `node --test tests/navigation/adaptive-navigation.test.mjs`，预期组件不存在而失败。
- [x] 实现无装饰性图标的文字导航；在 `App.vue` 仅于 H5 宽屏隐藏原生 `.uni-tabbar`；四个 Tab 页引入组件并留出左侧空间。
- [x] 将 `pages.json` Tab 顺序改为工作台、履职、随手拍、我的，不改路由。
- [x] 运行导航、工作台和既有全量测试并提交：`git commit -m "feat: add adaptive workbench navigation"`。

### Task 4: 领导工作台页面与交付门禁

**Files:**
- Create: `tests/workbench/page-contract.test.mjs`
- Modify: `src/pages/index/index.vue`
- Modify: `docs/开发日志.md`
- Modify: `docs/superpowers/plans/2026-08-03-leader-workbench.md`

**Interfaces:** 首页消费 `getWorkbenchSnapshot()`，展示数据状态、六项闭环指标、三项履职指标、重点待办和权限感知快捷入口。

- [x] 写失败页面契约测试，断言存在“演示数据”、六项闭环标签、三项履职标签、“重点待办”和 `getWorkbenchSnapshot`。
- [x] 运行 `node --test tests/workbench/page-contract.test.mjs`，预期当前首页未使用该服务而失败。
- [x] 以现有深矿物绿工作台体系重写首页；无履职权限显示“当前角色无履职总览权限”；没有真实数据时不产生真实经营结论。
- [x] 运行 `pnpm test`、`pnpm run build:h5`、`pnpm run build:mp-weixin`、`git diff --check` 和 Impeccable 检测器。
- [x] 记录开发日志、勾选全部任务并提交：`git commit -m "feat: deliver leader safety workbench"`。
