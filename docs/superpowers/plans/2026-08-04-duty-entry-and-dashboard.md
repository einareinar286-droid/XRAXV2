# 安全履职入口与仪表盘权限 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全员可进入个人安全履职，只有超级管理员与安监部可见全员履职仪表盘。

**Architecture:** 保持既有个人页 `/pages/duty/index` 与管理页 `/pages/admin/duty` 分离。仅修改宽屏自适应导航的展示项与顺序，不放宽 `DutyService` 的读写权限。

**Tech Stack:** uni-app、Vue 3、Node.js 内置测试。

## Global Constraints

- Cloudflare 仅承载匿名 Mock，不写入真实业务数据。
- 小程序底部 Tab 不在本次修改范围内。
- 超级管理员仍只能通过个人页填报自己的履职；审核他人记录的既有权限不变。

---

### Task 1: 锁定导航角色与顺序

**Files:**
- Modify: `tests/navigation/adaptive-navigation.test.mjs`
- Modify: `src/components/navigation/AdaptiveNavigation.vue`

- [ ] **Step 1: Write the failing test**

```js
assert.match(source, /\{ id: 'DUTY', label: '安全履职', path: '\/pages\/duty\/index' \}/)
assert.match(source, /\{ id: 'DUTY_DASHBOARD', label: '履职仪表盘'/)
assert.match(source, /base\[0\],[\s\S]*ASSIGN[\s\S]*DUTY[\s\S]*DUTY_DASHBOARD[\s\S]*REPORT/)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/navigation/adaptive-navigation.test.mjs`

- [ ] **Step 3: Write minimal implementation**

```js
{ id: 'DUTY', label: '安全履职', path: '/pages/duty/index' }
```

Place this item in the shared base navigation. Keep `ASSIGN` and `DUTY_DASHBOARD` in the privileged-only list before `REPORT`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/navigation/adaptive-navigation.test.mjs`

### Task 2: 保持页面语义与权限隔离

**Files:**
- Modify: `tests/duties/admin-page-contract.test.mjs`
- Modify: `src/pages/duty/index.vue`

- [ ] **Step 1: Write the failing test**

```js
assert.match(source, /AdaptiveNavigation active="DUTY"/)
assert.match(source, /我的安全履职/)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/duties/admin-page-contract.test.mjs`

- [ ] **Step 3: Write minimal implementation**

```vue
<text class="title">我的安全履职</text>
```

Keep the existing `listMyDuties()` call and do not add an all-person query to the personal page.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/duties/admin-page-contract.test.mjs`

### Task 3: 完整验证与提交

**Files:**
- Modify: `docs/开发日志.md`

- [ ] **Step 1: Run complete checks**

Run: `pnpm test`, `pnpm run build:h5`, `pnpm run build:mp-weixin`, and `git diff --check`.

- [ ] **Step 2: Record verified scope**

Append the role split, navigation order, and Mock-data boundary to `docs/开发日志.md`.

- [ ] **Step 3: Commit and push**

```bash
git add docs src tests
git commit -m "fix: separate duty entry from dashboard"
git push origin feature/leader-workbench
```
