# Signal Path Workbench UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 M1 Mock 隐患闭环升级为“信号路径工作台”，让小程序与 H5 用户在首屏识别风险、当前责任环节、时限和下一步操作。

**Architecture:** 不改 `IssueService`、Mock 适配器、状态机或 schema。新增纯 JavaScript 展示模型，将五个业务状态映射为“上报、交办、整改、复核、闭环”五节点，再由可复用 Vue 组件在 H5 宽屏渲染为三栏工作台、在小程序和窄屏渲染为单列与横向路径。

**Tech Stack:** uni-app、Vue 3、Sass、Node.js `node:test`、既有 `IssueService` Mock。

## Global Constraints

- 只改展示层和新增展示模型；不改 `src/services/issues/index.mjs` 的公开方法、业务状态机、云端 schema 或接口字段。
- 唯一业务状态仍为 `REPORTED`、`ASSIGNED`、`RECTIFICATION_SUBMITTED`、`REJECTED`、`CLOSED`；五节点仅为展示。
- `RECTIFICATION_SUBMITTED` 高亮“复核”，因为当前责任方是安全监察复核；`REJECTED` 高亮“整改”并显示退回标记；`CLOSED` 显示全路径完成。
- 角色操作继续由详情页既有 `canAssign`、`canRectify`、`canReview`、`canReopen` 控制；Mock 警示必须保留。
- 不新增 npm 依赖。动效只用 `transform`、`opacity`，时长 180–300ms，并在 `prefers-reduced-motion` 下关闭。
- 必须保留加载、空态、错误、无权限、版本冲突、附件数量和附件类型的既有语义。

---

### Task 1: 建立状态路径展示模型并锁定测试

**Files:**

- Create: `src/domain/issues/presentation.mjs`
- Create: `tests/issues/presentation.test.mjs`

**Interfaces:**

- Produces `buildIssueLifecycle(status)`: 返回五项 `{ key, label, state, returned }`；`state` 只能是 `completed`、`current`、`upcoming`。
- Produces `getIssueStageSummary(status)`: 返回 `{ currentLabel, nextLabel, hint }`。

- [ ] **Step 1: Write the failing tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildIssueLifecycle, getIssueStageSummary } from '../../src/domain/issues/presentation.mjs'

test('maps a submitted rectification to the safety review node', () => {
  assert.deepEqual(buildIssueLifecycle('RECTIFICATION_SUBMITTED').map(({ key, state, returned }) => ({ key, state, returned })), [
    { key: 'report', state: 'completed', returned: false },
    { key: 'assign', state: 'completed', returned: false },
    { key: 'rectify', state: 'completed', returned: false },
    { key: 'review', state: 'current', returned: false },
    { key: 'close', state: 'upcoming', returned: false }
  ])
  assert.equal(getIssueStageSummary('RECTIFICATION_SUBMITTED').nextLabel, '安全监察复核')
})

test('maps a rejected issue back to rectification with a return marker', () => {
  const rectify = buildIssueLifecycle('REJECTED').find((step) => step.key === 'rectify')
  assert.equal(rectify.state, 'current')
  assert.equal(rectify.returned, true)
  assert.equal(getIssueStageSummary('REJECTED').hint, '请根据退回原因补充整改佐证后再次提交')
})
```

- [ ] **Step 2: Run tests to verify RED**

Run: `node --test tests/issues/presentation.test.mjs`

Expected: FAIL because `presentation.mjs` is absent.

- [ ] **Step 3: Implement the minimal model**

```js
const blueprint = [['report', '上报'], ['assign', '交办'], ['rectify', '整改'], ['review', '复核'], ['close', '闭环']]
const stages = {
  REPORTED: { current: 0, nextLabel: '安全监察交办', hint: '等待安全监察人员明确责任部门和整改期限' },
  ASSIGNED: { current: 1, nextLabel: '市场营销部整改', hint: '请在整改期限内提交现场佐证' },
  RECTIFICATION_SUBMITTED: { current: 3, nextLabel: '安全监察复核', hint: '整改佐证已提交，等待安全监察复核' },
  REJECTED: { current: 2, returned: true, nextLabel: '市场营销部再次整改', hint: '请根据退回原因补充整改佐证后再次提交' },
  CLOSED: { current: 4, nextLabel: '已归档', hint: '隐患已闭环归档，可查看完整审计记录' }
}
export function buildIssueLifecycle(status) {
  const stage = stages[status] || stages.REPORTED
  return blueprint.map(([key, label], index) => ({
    key,
    label,
    state: index < stage.current ? 'completed' : index === stage.current ? 'current' : 'upcoming',
    returned: Boolean(stage.returned && key === 'rectify')
  }))
}
export function getIssueStageSummary(status) {
  const stage = stages[status] || stages.REPORTED
  return { currentLabel: blueprint[stage.current][1], nextLabel: stage.nextLabel, hint: stage.hint }
}
```

- [ ] **Step 4: Verify GREEN and commit**

Run: `node --test tests/issues/presentation.test.mjs; pnpm test`

Expected: the two new tests and all existing issue tests pass.

```bash
git add src/domain/issues/presentation.mjs tests/issues/presentation.test.mjs
git commit -m "feat: add issue lifecycle presentation model"
```

### Task 2: 提供可复用的跨端生命周期路径组件和 token

**Files:**

- Create: `src/components/issues/IssueLifecyclePath.vue`
- Modify: `src/uni.scss`
- Modify: `tests/issues/presentation.test.mjs`

**Interfaces:**

- Component props: `status: String`、`deadline: String`、`isMajor: Boolean`、`reviewReason: String`。
- Component consumes `buildIssueLifecycle` and `getIssueStageSummary`; it must be display-only and make no service call.

- [ ] **Step 1: Write the failing test**

```js
test('returns the five labels required by the lifecycle component', () => {
  assert.deepEqual(buildIssueLifecycle('ASSIGNED').map((step) => step.label), ['上报', '交办', '整改', '复核', '闭环'])
})
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/issues/presentation.test.mjs`

Expected: FAIL until the model has the exact ordered display labels.

- [ ] **Step 3: Implement component and semantic tokens**

Use this component contract:

```vue
<script setup>
import { computed } from 'vue'
import { buildIssueLifecycle, getIssueStageSummary } from '../../domain/issues/presentation.mjs'
const props = defineProps({
  status: { type: String, required: true }, deadline: { type: String, default: '' },
  isMajor: { type: Boolean, default: false }, reviewReason: { type: String, default: '' }
})
const steps = computed(() => buildIssueLifecycle(props.status))
const summary = computed(() => getIssueStageSummary(props.status))
</script>
```

In `src/uni.scss`, centralize canvas, panel, primary text, muted text, soft border, active path, major risk and warning variables. Preserve existing `$xr-green` through `$xr-line` as compatible aliases. The component must use `is-completed`、`is-current`、`is-upcoming`、`is-returned` classes; wide H5 uses a vertical rail, small screens use a horizontal scrolling-safe rail.

- [ ] **Step 4: Verify GREEN and commit**

Run: `node --test tests/issues/presentation.test.mjs; pnpm run build:h5`

Expected: 3 presentation tests pass and H5 compiles without Sass errors.

```bash
git add src/components/issues/IssueLifecyclePath.vue src/uni.scss tests/issues/presentation.test.mjs
git commit -m "feat: add responsive issue lifecycle path"
```

### Task 3: 改造隐患详情为核心任务工作台

**Files:**

- Modify: `src/pages/issue/detail.vue`
- Modify: `tests/issues/presentation.test.mjs`

**Interfaces:**

- Consumes `<IssueLifecyclePath :status="issue.status" :deadline="issue.deadline" :is-major="issue.isMajor" :review-reason="reviewNote" />`.
- Keeps all existing write methods, `can*` computed values, toast text and `VERSION_CONFLICT` reload behavior unchanged.

- [ ] **Step 1: Write the failing test**

```js
test('describes a closed issue as archived', () => {
  const summary = getIssueStageSummary('CLOSED')
  assert.equal(summary.currentLabel, '闭环')
  assert.equal(summary.nextLabel, '已归档')
})
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/issues/presentation.test.mjs`

Expected: FAIL until the closed-state stage summary matches the detail-page contract.

- [ ] **Step 3: Refactor the page without changing business behavior**

Use this structural layout:

```text
detail-workbench
├─ lifecycle-rail   (IssueLifecyclePath)
├─ task-main        (Mock notice, title/risk/meta and existing action cards)
└─ evidence-audit   (attachments, readonly note and immutable audit timeline)
```

At `<1200px`, render one column with the path above the summary. At `>=1200px`, use CSS Grid with left path, flexible main content and 300–360px evidence column; do not use absolute page positioning. Keep major risk visible with text and shape, move attachments to the evidence region, preserve all form controls and disabled states, and limit transitions to `transform`/`opacity` with a reduced-motion override.

- [ ] **Step 4: Verify GREEN and commit**

Run: `node --test tests/issues/presentation.test.mjs; pnpm run build:mp-weixin; pnpm run build:h5`

Expected: 4 presentation tests pass; both builds succeed.

```bash
git add src/pages/issue/detail.vue tests/issues/presentation.test.mjs
git commit -m "feat: redesign issue detail workbench"
```

### Task 4: 统一待办首页与随手拍体验

**Files:**

- Modify: `src/pages/index/index.vue`
- Modify: `src/pages/issue/create.vue`
- Modify: `src/pages.json`
- Modify: `tests/issues/presentation.test.mjs`

**Interfaces:**

- Homepage consumes existing `issueStore.load` and `loadMore`, plus `getIssueStageSummary(issue.status)`.
- Report page uses its existing `form` model and image/location helpers unchanged.
- `pages.json` retains every route and tab label.

- [ ] **Step 1: Write the failing test**

```js
test('labels an assigned issue as waiting for marketing rectification', () => {
  const summary = getIssueStageSummary('ASSIGNED')
  assert.equal(summary.currentLabel, '交办')
  assert.equal(summary.nextLabel, '市场营销部整改')
})
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/issues/presentation.test.mjs`

Expected: FAIL until the assigned-state summary names its next responsible stage.

- [ ] **Step 3: Implement page refinements**

Homepage retains pull-to-refresh, pagination and routes; every task card adds current stage and next action, and loading/error/empty states remain visibly distinct. Report page keeps every field and validation, but groups content as “基本信息、风险判断、地点与证据”, elevates photo capture and preserves upload count. Align global background/tab colors only if H5 and small-program text contrast remains clear. Maintain 88rpx-or-larger primary touch targets.

- [ ] **Step 4: Verify GREEN and commit**

Run: `node --test tests/issues/presentation.test.mjs; pnpm test; pnpm run build:mp-weixin`

Expected: 5 presentation tests pass, all issue tests pass and the small-program build succeeds.

```bash
git add src/pages/index/index.vue src/pages/issue/create.vue src/pages.json tests/issues/presentation.test.mjs
git commit -m "feat: align home and report UI with signal path"
```

### Task 5: 做跨端视觉核验并记录真实证据

**Files:**

- Modify: `docs/开发日志.md`
- Modify: `docs/spec/03-UI与交互验收-spec.md`
- Modify: `docs/spec/05-验收用例与追溯矩阵.md`

- [ ] **Step 1: Run release-adjacent checks**

Run: `pnpm test; pnpm run build:mp-weixin; pnpm run build:h5; git diff --check`

Expected: all commands exit 0. Record the existing Dart Sass legacy API warning; do not hide it.

- [ ] **Step 2: Run the UI detector once**

Run:

```bash
node C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs --json src/pages/index/index.vue src/pages/issue/create.vue src/pages/issue/detail.vue src/components/issues/IssueLifecyclePath.vue
```

Expected: capture findings and resolve blocking findings in one batch before final inspection.

- [ ] **Step 3: Inspect responsive output**

Use H5 preview to inspect 375px, 430px, 1280px and 1440px. Confirm current stage, risk, responsibility, deadline and next action are identifiable without color alone; confirm the 1200px+ detail page has readable three columns and mobile retains reachable primary actions.

- [ ] **Step 4: Record only verified results and commit**

Append a dated `2026-08-03` entry to `docs/开发日志.md`. Update only UI evidence that has actual build output or screenshots in the UI spec and acceptance matrix; leave token authorization, private attachment and true-device performance blocked.

```bash
git add docs/开发日志.md docs/spec/03-UI与交互验收-spec.md docs/spec/05-验收用例与追溯矩阵.md
git commit -m "docs: record signal path UI verification"
```

## Plan Self-Review

- Task 1 locks the presentation mapping; Task 2 adds the reusable component and tokens; Task 3 delivers the responsive core workbench; Task 4 aligns the list and report flow; Task 5 supplies automated, detector and viewport evidence.
- No task changes service contracts, Mock authorization, routes, tab labels, cloud functions or schema.
- New logic uses RED-GREEN tests. Vue SFC composition is checked through existing service tests, target builds and bounded visual inspection because the repository has no component-test runner.
