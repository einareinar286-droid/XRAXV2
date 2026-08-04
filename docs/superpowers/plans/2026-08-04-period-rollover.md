# 周期轮换履职任务引擎（Mock）实施计划

> 给实施者：必须使用 `superpowers:executing-plans`，逐项执行并在每个检查点停下复核。

**目标：** 履职任务按周期（每日/每周/每两周/每月/每季度/每半年/每年）自动轮换：到期后生成下一周期新任务，旧任务保留为历史并进入考核统计；填报人=登录账号；任务逐条展示不拼接。节假日前（HOLIDAY_EVE）周期暂缓，仅预留枚举。

**数据边界：** 全程匿名 Mock。`clipboard-*.xlsx` 两份参考表（665 行花名册、471 行履职明细，含真实姓名与手机号）仅在本机读取用于提取业务结构（部门/岗位/动作名称/频率/说明模板）；提取结果以匿名常量写入 `mock-data.mjs`；姓名、手机号、附件一律不进入代码、Git、构建产物或 Cloudflare。

**架构：** 纯函数周期计算 -> Mock 适配器惰性轮换 -> 页面消费。不修改权限模型（`ownerUid === currentUser.uid` 填报校验与既有查看范围不变）、不修改 schema、不增加运行时依赖。

## 交付与验收口径

- `PERIOD_TYPES` 枚举含 `DAILY/WEEKLY/BIWEEKLY/MONTHLY/QUARTERLY/SEMIANNUAL/ANNUAL/HOLIDAY_EVE`；`nextDueDate(periodType, dueDate)` 按 rolling 推进（从当前截止日计算下一截止日），MONTHLY/QUARTERLY/SEMIANNUAL 做月末/年末安全（1-31 -> 2-28）；`HOLIDAY_EVE` 调用返回 `NOT_IMPLEMENTED`。
- 到期判定：`dueDate < asOf`（当天未过不算到期）。轮换只在到期时触发，完成不触发。
- 轮换生成新任务：新 id、`status: 'PENDING'`、截止日推进、周期区间连续（`[旧截止日+1, 新截止日]`）；旧任务标记 `cycleRolledOver: true` 保留，仍按既有 `metrics` 规则进入考核（未按时通过）。
- 同一任务不得重复轮换；未到期不轮换；无 `periodType` 的既有任务行为不变（向后兼容）。
- 匿名 seed 覆盖全部 7 种可用周期，任务逐条（数组元素），不含任何拼接字符串字段。
- `pnpm test`、`pnpm run build:h5`、`pnpm run build:mp-weixin`、`git diff --check` 全部通过。

## 实施步骤

### 1. 周期领域内核（先写失败测试）

**文件：** 新建 `src/domain/duties/periods.mjs`、新建 `tests/duties/periods.test.mjs`

- 测试：DAILY/WEEKLY/BIWEEKLY/MONTHLY/QUARTERLY/SEMIANNUAL/ANNUAL 各推进一周期；MONTHLY 月末（2026-01-31 -> 2026-02-28）、QUARTERLY 月末（2026-03-31 -> 2026-06-30）、ANNUAL 年末（2026-12-31 -> 2027-12-31）；HOLIDAY_EVE 抛 `NOT_IMPLEMENTED`；非法周期抛 `INVALID_PERIOD`。
- 实现：UTC 日期运算（避免本地时区偏移），输出 `YYYY-MM-DD`。

**检查点：** `node --test tests/duties/periods.test.mjs` 通过。

### 2. 匿名 seed 与惰性轮换（先写失败测试）

**文件：** 修改 `src/services/duties/mock-data.mjs`、修改 `src/services/duties/mock-adapter.mjs`、修改 `tests/duties/mock-adapter.test.mjs`、新建 `tests/duties/rollover.test.mjs`

- seed 增加带 `periodType/cycleStart/cycleEnd/cycleKey` 的匿名任务（覆盖 7 种周期，4 个 Mock 账号按岗位语义分配）。
- adapter 增加私有 `rolloverDueCycles(asOf)`，在 `listMyDuties/getDutyDashboard/listDutyPeople` 入口惰性触发（以 `now()` 为基准）。
- 测试：到期任务轮换生成新任务（PENDING、截止日推进、区间连续）；旧任务保留且 `cycleRolledOver`；未到期不轮换；重复读取不重复生成；轮换后考核统计包含旧任务、不含未来新任务；无 `periodType` 任务不轮换。

**检查点：** 新增测试与既有 14 项 duties 测试全部通过。

### 3. 页面周期展示（先写失败测试）

**文件：** 修改 `src/pages/duty/index.vue`、`src/pages/duty/record.vue`、修改 `tests/duties/personal-page-contract.test.mjs`

- 个人列表任务卡展示周期类型徽标与周期区间（`periodType` 有值时）。
- 填报页 summary 展示周期区间与截止日。
- 页面只展示服务返回字段，不做轮换或权限逻辑。

**检查点：** 页面契约测试转绿，个人列表仍逐条渲染。

### 4. 完整验证、文档收口与分支提交

**文件：** 修改 `docs/开发日志.md`

- 执行 `pnpm test`、`pnpm run build:h5`、`pnpm run build:mp-weixin`、`git diff --check`；敏感扫描确认无真实姓名/手机号/Excel。
- 记录周期轮换交付、匿名数据边界证据与下一步（M3B 真实账号映射、节假日前周期、G3 周期筛选）。
- 在 `feature/leader-workbench` 提交并推送；不更新 Cloudflare。

**检查点：** 全部门禁通过；发布集合仅含代码、匿名测试与文档。
