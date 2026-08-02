# XRAXV2 M1 设计说明

## 目标

在不修改现有履职云对象与 schema 的前提下，将隐患演示数据从 Vue 响应式内存对象中剥离，形成可由 Mock、uniCloud 或公司 API 实现的稳定服务契约。M1 只交付可验证的 Mock 闭环，不宣称具备生产身份认证、私有附件存储或真机性能结论。

## 架构

- `src/domain/issues/`：纯 JavaScript 领域规则，包含状态、角色、错误、输入校验和授权判断，不依赖 Vue、`uni` 或 `uniCloud`。
- `src/services/issues/mock-adapter.mjs`：内存数据、当前 Mock 会话、幂等记录和追加式审计；所有读写都从会话取身份并重新授权。
- `src/services/issues/index.js`：前端唯一服务门面，稳定暴露八个业务方法；未来适配器替换不改变页面调用。
- `src/stores/issues.js`：只管理页面加载状态、分页和刷新，不复制状态机或权限逻辑。
- 页面：仅根据服务返回的当前用户与隐患状态展示操作；隐藏按钮只改善体验，不构成授权边界。

## 状态与授权

状态迁移唯一允许：

```text
REPORTED -> ASSIGNED
ASSIGNED -> RECTIFICATION_SUBMITTED
REJECTED -> RECTIFICATION_SUBMITTED
RECTIFICATION_SUBMITTED -> CLOSED
RECTIFICATION_SUBMITTED -> REJECTED
CLOSED -> REPORTED (SAFETY_ADMIN only)
```

- `SAFETY_INSPECTOR`：上报、交办、复核、退回及职责范围读取。
- `SAFETY_ADMIN`：巡检员能力、跨部门读取和留痕重开。
- `MARKETING_RECTIFIER`：仅读取和整改交办给本人或本部门的隐患。
- `EXECUTIVE_READONLY`：仅按范围读取，所有写入拒绝。

## 一致性与审计

- 交办、整改、复核和重开必须携带当前 `version` 与 `requestId`。
- 版本不符返回 `VERSION_CONFLICT`；相同请求重复发送返回首次结果且不重复审计；同一键配不同内容返回 `DUPLICATE_REQUEST`。
- 每次状态变化追加一条 `AuditEvent`。`payloadSummary` 只保留决策、期限、附件数量等摘要，不保存完整说明、附件地址、身份令牌或密钥。

## 附件与验证

- 附件最多 6 个，仅 JPEG、PNG、WebP，单个不超过 10 MiB。
- Mock 附件只在调用者有权读取对应隐患时返回；M1 不提供公开下载 URL，也不等同于真实私有存储。
- 领域和适配器使用 Node 内置测试器覆盖状态、授权、幂等、版本、审计、附件和分页；页面通过微信小程序与 H5 构建验证。

## 发布边界

- 应用版本为 `0.2.0`，继续使用“徐燃安巡”产品名。
- 本地 `AGENTS.md`、子项目提示词、代理地址和临时归档不得进入公开仓库。
- 所有门禁通过后再创建 `einareinar286-droid/XRAXV2`，保留上游提交历史并追加 M1 提交。
