# 徐燃安巡里程碑、Spec 与验收体系实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不修改业务实现、UI 视觉或数据结构的前提下，为徐燃安巡隐患闭环建立可执行、可追溯的规格、里程碑、验收和发布门禁文档。

**Architecture:** 文档按“证据与边界、三类独立 Spec、里程碑与门禁、用例与追溯、变更控制”分层。每个尚无实际代码、测试或真机记录支撑的结论明确标记为“阻塞/待证”，避免用需求文本替代验证证据。

**Tech Stack:** Markdown、Git；业务工程预期为 uni-app、Vue 3、Vite、uniCloud，但当前工作区未提供可核验的工程文件。

## Global Constraints

- 本期范围仅为隐患“上报 → 交办 → 整改 → 复核 → 闭环”基础；履职能力仅作为回归保护。
- 角色与状态机以 `docs/三模块开发规格与提示词.md` 为唯一共享业务基线；不得新增业务状态或越权动作。
- 不新增、修改或删除业务代码、公共 API、数据结构、schema、云端配置或 UI 视觉实现。
- 服务端 token 鉴权与部门受办范围校验是唯一安全边界；前端角色切换仅限 Mock 演示。
- 性能验收目标：真机常规交互 60 FPS；内容转场 180–300 ms，默认 220 ms，且仅动画 `transform` 与 `opacity`。
- 缺少实际工程、测试、日志或真机数据时，验收结论必须写为“阻塞”，不得声称已通过。

---

### Task 1: 建立现状证据与规格边界

**Files:**
- Create: `docs/spec/00-现状证据与边界.md`
- Create: `docs/开发日志.md`

**Interfaces:**
- Consumes: `AGENTS.md`、`docs/02-里程碑Spec与验收-子项目提示词.md`、`docs/三模块开发规格与提示词.md`
- Produces: 可被后续所有 Spec 引用的证据清单、缺口与文档职责边界。

- [ ] **Step 1: 记录仓库现状与证据来源**

在 `00-现状证据与边界.md` 列出已核验的四份提示词、缺失的 `README.md`、`src/`、`uniCloud-aliyun/`、开发日志和远程仓库；说明提示词仅能作为需求依据，不能作为实现或测试通过证据。

- [ ] **Step 2: 写明模块职责与非职责**

明确模块 02 只维护规格、里程碑、验收、追溯和门禁；代码实现归模块 01，视觉实现归模块 03，跨界变更须走变更记录。

- [ ] **Step 3: 追加首条开发日志**

在 `docs/开发日志.md` 写入日期、目标、创建文件、现状差异、已执行核验命令、真实结果、风险和下一步；不得记录 token、密钥、代理地址或伪造验证结果。

- [ ] **Step 4: 验证证据文档完整性**

Run: `rg -n "README.md|src/pages.json|uniCloud-aliyun|阻塞|模块 02" docs/spec/00-现状证据与边界.md docs/开发日志.md`

Expected: 每类缺失证据、阻塞规则和模块边界均可定位。

### Task 2: 编写业务、权限与安全 Spec

**Files:**
- Create: `docs/spec/01-业务权限与安全-spec.md`

**Interfaces:**
- Consumes: `docs/spec/00-现状证据与边界.md`、共享状态机与角色矩阵
- Produces: 模块 01 与模块 03 可共同引用的业务规则、字段、接口语义与安全验收要求。

- [ ] **Step 1: 冻结角色、部门范围与状态机**

使用四角色权限矩阵和五状态状态机，逐项说明发起者、前置状态、允许动作、后置状态、服务端校验和拒绝语义；唯一例外为 `SAFETY_ADMIN` 按制度留痕重开 `CLOSED`。

- [ ] **Step 2: 定义领域字段与保留规则**

分别定义 `Issue`、`Rectification`、`AuditEvent` 的必填字段、格式/长度/枚举校验、版本字段、附件元数据、审计追加写入与留存要求；明确审计记录禁止客户端直改删。

- [ ] **Step 3: 定义稳定服务契约与错误语义**

为 `getCurrentUser`、`listIssues`、`getIssue`、`reportIssue`、`assignIssue`、`submitRectification`、`reviewIssue`、`listAuditEvents` 写入调用目的、权限、输入、成功输出和统一错误码。错误码须至少覆盖未认证、无权限、部门范围拒绝、非法状态、冲突、幂等重复、校验失败、附件拒绝和内部错误。

- [ ] **Step 4: 写明安全控制与证据要求**

规定 token 身份解析、忽略客户端角色/部门/状态、私有附件受控下载、文件限制、乐观锁/幂等、审计、重开与删除约束；每项绑定后续测试或运行记录的证据类型。

- [ ] **Step 5: 验证状态与接口覆盖**

Run: `rg -n "REPORTED|ASSIGNED|RECTIFICATION_SUBMITTED|REJECTED|CLOSED|getCurrentUser|AUTH_REQUIRED|STATE_CONFLICT" docs/spec/01-业务权限与安全-spec.md`

Expected: 五个状态、八个服务方法及关键拒绝语义均可定位。

### Task 3: 编写研发与性能 Spec

**Files:**
- Create: `docs/spec/02-研发与性能-spec.md`

**Interfaces:**
- Consumes: `docs/spec/01-业务权限与安全-spec.md`
- Produces: Mock 至真实后端迁移、自动化验证、性能测量、兼容与回滚的实施准则。

- [ ] **Step 1: 规定适配器替换边界**

定义前端只依赖稳定服务接口，Mock、uniCloud/公司 API 实现同一契约和错误语义；列出运行时选择策略、禁止事项和真实后端接入验收点。

- [ ] **Step 2: 规定兼容、迁移与回滚要求**

定义任何 API、schema、角色或状态机变更必须附带影响范围、迁移方案、回滚步骤、验证证据和责任角色；特别要求不破坏现有履职云端能力。

- [ ] **Step 3: 规定自动化与回归策略**

列出闭环、授权、状态跳转、幂等、附件、履职回归、构建和弱网失败的可重复验证要求；当前缺少工程时列出阻塞证据与补证入口。

- [ ] **Step 4: 规定性能指标与测量方法**

写明 60 FPS、首屏最小数据、列表分页/增量渲染、图片压缩/缩略图/懒加载、防连点和冲突处理；定义微信开发者工具与至少一台真机的场景、记录字段、未达标处置和降级策略。

- [ ] **Step 5: 验证性能门槛可追溯**

Run: `rg -n "60 FPS|180–300|Mock|uniCloud|回滚|微信开发者工具|真机" docs/spec/02-研发与性能-spec.md`

Expected: 每项性能底线、迁移要求和测量证据均可定位。

### Task 4: 编写 UI 与交互验收 Spec

**Files:**
- Create: `docs/spec/03-UI与交互验收-spec.md`

**Interfaces:**
- Consumes: `docs/spec/01-业务权限与安全-spec.md`、`docs/spec/02-研发与性能-spec.md`
- Produces: 模块 03 可执行的页面、角色可见性、全状态与动效验收标准；不替代视觉决策。

- [ ] **Step 1: 规定关键页面和信息优先级**

覆盖待办、随手拍、隐患详情、整改提交、复核结论、我的/登录状态；要求三秒内识别状态、责任部门、截止时间、是否重大及下一步动作。

- [ ] **Step 2: 规定角色可见性与交互状态**

逐角色定义可见与不可见动作，覆盖加载、空数据、网络失败、无权限、附件上传失败、表单校验、提交成功及状态同步反馈。

- [ ] **Step 3: 规定动效与可用性验收**

定义 180–300 ms 内容过渡、仅 `transform`/`opacity`、原生 Tab/导航不覆盖、减少动画偏好与弱机降级；禁止会破坏帧率的动画属性。

- [ ] **Step 4: 验证 UI 验收范围完整**

Run: `rg -n "待办|随手拍|隐患详情|加载|空数据|无权限|220 ms|transform|opacity" docs/spec/03-UI与交互验收-spec.md`

Expected: 关键页面、全状态和动效约束均可定位。

### Task 5: 建立里程碑、验收用例、追溯与发布门禁

**Files:**
- Create: `docs/spec/04-里程碑与发布门禁.md`
- Create: `docs/spec/05-验收用例与追溯矩阵.md`
- Create: `docs/spec/06-需求变更记录.md`
- Modify: `docs/开发日志.md`

**Interfaces:**
- Consumes: 三份 Spec 中的需求编号、证据规则和性能/安全约束
- Produces: M0–M5 的可验收里程碑、可执行用例、发布决策表与受控变更入口。

- [ ] **Step 1: 定义 M0–M5 里程碑**

每个里程碑必须包含目标、范围外事项、入口条件、依赖、交付物、验收用例、退出标准、风险和责任角色；M0 为基线与契约冻结，M5 为试运行准备与发布门禁。

- [ ] **Step 2: 编写必备验收用例**

为正向闭环、角色越权、部门越权、伪造角色、跨状态跳转、重复提交、闭环后修改、附件越权、网络失败、空态、加载态、真机帧率和履职回归逐一写入前置条件、步骤、预期结果、证据类型与通过/阻塞结论栏。

- [ ] **Step 3: 建立需求追溯矩阵**

为每项需求分配编号，关联里程碑、预期代码模块、测试/验收用例、证据位置和开发日志位置；对当前缺失的代码和证据标明“阻塞，待目标工程接入”。

- [ ] **Step 4: 建立变更控制与发布门禁**

定义公共 API、schema、角色、状态机的变更单字段及审批责任；定义功能、权限、安全、性能、兼容、日志/审计、回归七类门禁，任何一项无证据即阻塞试运行。

- [ ] **Step 5: 更新开发日志并验证文档质量**

Run: `rg -n "M0|M1|M2|M3|M4|M5|正向闭环|角色越权|部门越权|伪造角色|重复提交|附件越权|发布门禁" docs/spec/04-里程碑与发布门禁.md docs/spec/05-验收用例与追溯矩阵.md`

Expected: 六个里程碑、十三类必备验收场景与七类门禁均可定位。

### Task 6: 执行文档自检并准备 Git 交付

**Files:**
- Modify: `docs/spec/*.md`
- Modify: `docs/开发日志.md`

**Interfaces:**
- Consumes: 全部新建文档
- Produces: 可提交的规格文档集及真实验证记录。

- [ ] **Step 1: 执行一致性检查**

Run: `rg -n "TODO|TBD|待补|待定|待确认" docs/spec docs/开发日志.md`

Expected: 不出现未声明处理方式的占位符；“阻塞/待证”只能用于外部工程或真实证据尚未提供的事项。

- [ ] **Step 2: 执行状态机与术语检查**

Run: `rg -n "待办|已完成|处理中|直接删除" docs/spec`

Expected: 不存在与五状态机冲突的新增业务状态或直接删除能力。

- [ ] **Step 3: 执行文件与 Git 变更检查**

Run: `git diff --check; git status --short`

Expected: 无空白错误；变更仅包含 `docs/spec/`、`docs/superpowers/plans/` 与 `docs/开发日志.md`，不改动原始提示词。

- [ ] **Step 4: 追加最终开发日志条目**

写入文档自检命令与真实结果、当前阻塞项（目标工程与远程仓库未提供）、下一步（接入工程后回填实现和测试证据）。

- [ ] **Step 5: 创建提交但暂不推送**

Run: `git add docs && git commit -m "docs: add milestone specs and acceptance framework"`

Expected: 本地创建仅包含模块 02 文档的提交；在提供 GitHub 远程前不执行 push。
