# 徐燃安巡 · uniCloud 部署进展存档（2026-08-05）

> 用途：对话防丢失存档。下次继续开发前先读本文件 + `docs/开发日志.md` + `docs/superpowers/plans/2026-08-05-unicloud-duty-adapter.md`。
> 本文件记录：技术路线、云端资产清单、已完成/未完成、关键坑、密钥位置、下一步。

## 一、技术路线（已锁定，不得变更）

```
uni-app/Vue3 → 微信小程序(mp-weixin) → uniCloud 阿里云 → 云数据库/云函数/云存储 → 微信审核发布
```

- ❌ 禁止：SQLite、Express/Fastify、自建服务器、独立域名、删除 uniCloud 目录
- ✅ 红线：全程匿名 Mock；不导入真实姓名/手机号/附件；敏感扫描 0 命中

## 二、项目位置（重要！别再找错）

| 用途 | 路径 |
|---|---|
| **唯一开发目录** | `Z:\新建文件夹\项目面板源文件\XRAXV2\.worktrees\feature-leader-workbench` |
| 旧干扰目录（已改名） | `Z:\新建文件夹\项目面板源文件\XRAXV2\dist\build\mp-weixin_OLD_勿用`、`XRAXV2-m2-core\dist\build\mp-weixin_OLD`、`D:\xrax\dist\dev\mp-weixin_OLD` |
| 微信开发者工具导入路径 | `Z:\新建文件夹\项目面板源文件\XRAXV2\.worktrees\feature-leader-workbench\dist\build\mp-weixin` |
| GitHub | https://github.com/einareinar286-droid/XRAXV2.git 分支 `feature/leader-workbench` |

## 三、账号与云端资产（全部就绪 ✅）

| 项 | 值 |
|---|---|
| 测试版微信 AppID | `wx8a77ad30a25292e9` |
| uniCloud 服务空间 | `xraxbeta1`（阿里云，免费基础版） |
| spaceId | `mp-26bb2b7f-109b-4fb9-b5bc-1d2e90561c9c` |
| clientSecret | 见本地 `.env`（不入库） |
| HBuilderX 登录账号 | `1565031066@qq.com` |
| 云端云函数 | `auth-service`（登录）、`duty-service`（履职） |
| 云端公共模块 | `uni-config-center`、`uni-id-common` |
| 云端 6 张表 | `uni-id-users`、`uni-id-roles`、`xr-duty-templates`、`xr-duty-instances`、`xr-duty-audit`、`xr-duty-assignments` |

## 四、已完成 ✅

### 4.1 UI 替换（Obsidian Cipher 深色玻璃设计系统）
- `src/uni.scss` + `App.vue`：深色 token + 玻璃拟态工具类
- 9 个页面全部深色玻璃化，script 零改动
- 提交 `1d93a77`

### 4.2 daily 周期口径对齐（云端）
- `templates.schema` frequency 枚举补 `daily`；`duty-service.advancePeriod` 补 daily 分支
- 契约测试锁定；提交 `7541f57`（已上传云端）

### 4.3 P0 uni-id 登录闭环（**实测成功**）
- 云端：`auth-service` 云对象（register 首个账号自动超管 / login / logout / me）+ `uni-id-users` / `uni-id-roles` schema
- 前端：登录页 `pages/login/index`（注册/登录双模式）+ `src/services/auth/index.mjs` + `src/services/duties/mode.mjs`（Mock/云开关）+ profile 页底部"云端登录"霓虹卡片
- 域逻辑：`src/domain/auth/password.mjs`（HMAC-SHA256+盐）+ `roles.mjs`（四角色）
- **实测**：微信开发者工具注册 `admin001` 成功，token 闭环生效
- 提交：`0f060fc`（P0 主体）、`2b0f8ac`（首个账号引导）、`9377171`（注册页）、`48f29ff`（structuredClone 修复）、`d0ddbfc`（v-if 括号修复）、`32b96e4`（uni-id 配置内联）、`0ac9aed`（cloud 构建脚本）

## 五、关键坑与解决方案（防止重踩）

| # | 坑 | 现象 | 修复 |
|---|---|---|---|
| 1 | 小程序端模板 `v-if="函数名"` | 入口永远不显示（编译成 `unref(函数)`，微信判假） | 必须写 `v-if="isCloudDutyMode()"`（带括号） |
| 2 | CLI 构建缺 uniCloud 配置 | 运行报"cli项目内使用uniCloud需要HBuilderX运行" | 构建时注入 `UNI_CLOUD_PROVIDER` 环境变量（JSON 数组含 provider/spaceId/clientSecret） |
| 3 | 云端 uni-config-center 配置缺失 | auth-service 报 `Invalid uni-id config file` | `createInstance({ clientInfo, config })` 内联配置，不依赖云端配置文件 |
| 4 | `structuredClone` 小程序不存在 | 启动黑屏 | 换成 `deepClone`（JSON 兜底），5 个 mock 文件 |
| 5 | 微信开发者工具缓存旧项目 | 看不到新功能 | 清编译缓存 + 确认导入 worktree 路径 + 登录态丢失需重扫 |

## 六、构建命令（重要）

```bash
# 普通构建（Mock 模式，默认）
corepack pnpm run build:mp-weixin

# 云模式构建（连接 uniCloud，含服务空间配置）★ 登录/云数据用这个
corepack pnpm run build:mp-weixin:cloud
# 实现：scripts/build-cloud.mjs 读 .env（UNI_CLOUD_PROVIDER + VITE_XR_DUTY_MODE）后执行 uni build
```

- `.env`（本地，含密钥）已 gitignore；`.env.example`（模板）已入库
- 测试：`corepack pnpm test`（101 项全绿）

## 七、进行中 / 待办

### P1：云端能力补齐（未开始，3-5 天）
duty-service 现状：只有 `myInstances/adminInstances/submitInstance/_timing`，状态机 `PENDING/OVERDUE/DONE`。
需补齐（对齐前端 mock-adapter）：
1. `myDuties({periodType})`：本人履职列表（对齐前端 task 形状）
2. `submitDuty(instanceId, {note, attachments})`：提交 → `SUBMITTED`（不直接 DONE），允许 `RETURNED` 重提
3. `reviewDuty(instanceId, {decision, note})`：`APPROVE/RETURN`，写 audit
4. `dutyDashboard({asOf, periodType})`：公司/部门聚合
5. `dutyPeople({department, dutyStatus, keyword, periodType})`：人员明细
6. 状态机改 `PENDING/SUBMITTED/APPROVED/RETURNED/OVERDUE`
7. **角色对齐（EE 决策 3）**：仅 `SUPER_ADMIN` 可增删改数据与审核，其余角色只填报本人（当前 `isAdmin` 用旧角色 `SAFETY_ADMIN` 需改）

### P2：前端云适配器（未开始，1-2 天）
- 新增 `src/services/duties/cloud-adapter.mjs`（与 mock-adapter 同接口）
- `index.mjs` 加切换开关（Mock 默认，云模式显式开启）
- 页面零改动

### P3：联调验证（未开始，0.5-1 天）
- 登录 → 履职列表/填报/审核/仪表盘全链路走云端

## 八、EE 已确认的 4 项决策（2026-08-05）

1. **角色体系**：前端四角色 `SUPER_ADMIN / SAFETY_OFFICER / MARKETING_OFFICER / EMPLOYEE`
2. **账号策略**：假账号（测试号 AppID 阶段），不导入真实姓名/手机号
3. **权限边界**：**仅 SUPER_ADMIN 可增删改数据与审核；其余角色只有填写的权力**
4. **默认模式**：Mock 默认，云模式 `VITE_XR_DUTY_MODE=cloud` 显式开启

## 九、下轮会话开头操作指引

1. `cd Z:\新建文件夹\项目面板源文件\XRAXV2\.worktrees\feature-leader-workbench`
2. `git status` / `git log --oneline -5` 确认状态
3. `corepack pnpm test` 确认 101 全绿
4. 若需云端验证：`corepack pnpm run build:mp-weixin:cloud` → 微信开发者工具导入
5. 云端 CLI（HBuilderX）：`cd /d/HBuilderX && ./cli.exe cloud functions --list cloudfunction --prj feature-leader-workbench --provider aliyun --cloud`
