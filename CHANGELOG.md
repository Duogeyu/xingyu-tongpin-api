# 更新记录

接口要变的地方先写在这里，旧的写法会留一段时间再停。

## 2026-10-25 · 设备授权、用星遇同频登录

- 设备授权（推荐的连接方式）：`POST device/code` 拿码和同意链接，玩家在浏览器里看到客户端名字后点同意，客户端每 5 秒 `POST device/token` 拿令牌。
- 连接码 `POST connect` 还能用，算旧方式；新客户端请用设备授权。
- 每个客户端有自己的授权：不再顶掉玩家 VRCX 脚本里的连接。同一个客户端再授权一次，它之前的令牌失效；每位玩家最多 10 个。玩家在「我的资料 → 第三方客户端」能看到并单独断开；`disconnect` 只断开这一个。
- 提醒轮询的 25 秒间隔按每个授权算。
- 用星遇同频登录（OAuth 2.0 授权码 + PKCE）：网站在「我的资料 → 第三方客户端 → 开发者 → 我登记的网站」自己登记；跳 `https://vrcc.cc/oauth/authorize`，回来用 `POST oauth/token` 换令牌，`GET oauth/userinfo` 再查。拿到的只有 `sub`、星号和验证过的 VRChat 账号。
- 新示例 `examples/login-site.mjs`；`examples/client.mjs` 加了 `login`（设备授权）。

## 2026-10-24 · 第一版（/api/v1/）

- 开放数据：地图榜排行 `boards/maps`、查地图 `maps?ids=`、`maps/{world}`，不用登录；VRChat 世界里的组件可以把 `client` 放在网址里。
- 玩家自己的：`connect`、`disconnect`、`me/notifications`、`me/notifications/recent`、`me/crossings`、`me/mutuals`、`me/maps/{world}`、`me/maps/{world}/rating`，令牌放在 `Authorization` 请求头里。
- 每个请求都要带登记过的 `client` 标识（开发时 `dev-` 开头）；没登记的回答 `client_unknown`，被停用的回答 `client_off`。
- Tauri 客户端的页面（`tauri://localhost`、`http(s)://tauri.localhost`）能读到回答。
- 玩家连上时，站内通知和「我的资料」里写明是哪个客户端。
