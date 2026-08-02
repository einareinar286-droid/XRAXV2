# 徐燃安巡 XRAXV2

徐燃安巡是微信小程序优先的 uni-app Vue 3 项目。`0.2.0`（M1）把原前端内存演示升级为可测试、可替换后端的隐患 Mock 闭环，同时保留原安全履职模块。

> [!WARNING]
> 当前是 Mock 演示，不具备生产级登录鉴权、真实 uniCloud 隐患部署或私有云附件存储。请勿用于真实生产数据，也不要把演示角色切换视为安全边界。

## M1 能力

- 正向闭环：`REPORTED → ASSIGNED → RECTIFICATION_SUBMITTED → CLOSED`。
- 退回整改：`RECTIFICATION_SUBMITTED → REJECTED → RECTIFICATION_SUBMITTED`。
- 管理员留痕重开：`CLOSED → REPORTED`，随后重新交办。
- 四类 Mock 身份：安全巡检/复核员、安全监察管理员、市场整改员、高管只读用户。
- 纯 JavaScript 领域内核：状态机、权限策略、输入校验、统一错误码、乐观锁、请求幂等和追加式审计。
- 附件只保存演示元数据；未授权用户不能读取隐患、附件元数据或审计时间线。
- 首页异步加载、空态、失败重试、分页；写操作防连点并在版本冲突时刷新。

稳定服务接口位于 `src/services/issues/index.mjs`：

```text
getCurrentUser()      listIssues(filters)
getIssue(id)          reportIssue(payload)
assignIssue(id, payload)
submitRectification(id, payload)
reviewIssue(id, payload)
listAuditEvents(id)
```

## 本地验证

需要 Node.js 22 与 pnpm：

```powershell
pnpm install --frozen-lockfile
pnpm test
pnpm run build:mp-weixin
pnpm run build:h5
git diff --check
```

微信开发者工具可导入构建后的 `dist/build/mp-weixin`。本仓库未配置真实微信 AppID。

## M1 不包含

- 真实账号、生产级鉴权与组织数据。
- 真实 uniCloud 隐患服务、私有附件和订阅消息。
- AI 审核、真机性能或 60 FPS 结论。
- 生产环境地图、通知、AI 密钥或其他凭据。

后续接入真实后端时，应保持页面只调用稳定服务接口，并由服务端从可信会话解析操作者身份；不得直接复用 Mock 身份切换作为生产实现。
