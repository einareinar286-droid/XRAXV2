# 徐燃安巡项目接续规则

## 项目定位

- 徐州中燃能源有限公司的安全隐患闭环演示工程；微信小程序优先，后续扩展 H5、Android、iOS 与 Windows。
- 技术栈为 DCloud 官方 uni-app（Vue 3、Vite）和 uni-ui；避免引入平台专有或无人维护的插件。

## 常用命令

```powershell
cd D:\xrax
pnpm run build:mp-weixin
```

- 小程序产物在 `dist/build/mp-weixin`，导入微信开发者工具查看。
- HBuilderX 编译须保持 `src/manifest.json` 的 `vueVersion: "3"`；依赖使用 pnpm，勿用 npm 重装 pnpm 布局的依赖。

## 目录与边界

- `src/pages`：小程序页面；`src/services`：云端/平台调用封装；`src/stores/demo.js`：仅演示数据。
- `uniCloud-aliyun`：履职云对象和四张表 schema，必须关联公司 UniCloud 空间后才能启用。
- `docs`：开发日志、插件核验、云端启用与项目交接说明。
- 不得将 AppID、AI Key、地图/消息密钥、真实人员资料或现场照片写入仓库；AI 审核只能由服务端调用。
- 现场图片云上传属于敏感数据处理，须在用户明确确认并完成云端权限配置后实施。

## 当前验收状态

- `pnpm run build:mp-weixin` 已通过；微信开发者工具曾出现首屏空白，尚未取得运行时控制台错误并修复，不能视为视觉验收通过。
- 安全履职的真实周期、权限和审计已设计为云对象能力，尚未连接 UniCloud、官方 uni-id 登录或真实数据库。
- 送气工画像 C 类、企业通知、AI 审核、生产账号与真实文件存储均为后续工作。

## 下一步

1. 在微信开发者工具查看 Console，定位并修复首屏空白后再做小程序验收。
2. 由公司关联 UniCloud 空间，安装并配置官方 `uni-id-pages` / `uni-id-common`，再导入履职人员与模板。
3. 获得照片上云与通知通道的业务授权后，再接入存储和服务端推送。
