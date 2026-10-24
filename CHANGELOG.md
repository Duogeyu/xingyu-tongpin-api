# 更新记录

接口要变的地方先写在这里，旧的写法会留一段时间再停。

## 2026-10-24 · 第一版（/api/v1/）

- 开放数据：地图榜排行 `boards/maps`、查地图 `maps?ids=`、`maps/{world}`，不用登录；VRChat 世界里的组件可以把 `client` 放在网址里。
- 玩家自己的：`connect`、`disconnect`、`me/notifications`、`me/notifications/recent`、`me/crossings`、`me/mutuals`、`me/maps/{world}`、`me/maps/{world}/rating`，令牌放在 `Authorization` 请求头里。
- 每个请求都要带登记过的 `client` 标识（开发时 `dev-` 开头）；没登记的回答 `client_unknown`，被停用的回答 `client_off`。
- Tauri 客户端的页面（`tauri://localhost`、`http(s)://tauri.localhost`）能读到回答。
- 玩家连上时，站内通知和「我的资料」里写明是哪个客户端。
