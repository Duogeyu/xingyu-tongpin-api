# 更新记录

接口要变的地方先写在这里，旧的写法会留一段时间再停。

## 2026-10-25 · 第二批：今天的星、连向我、连线、私聊、星友圈

- 新权限和接口，做的事和网页一样，网页的规则和上限照样算：`today`（`GET me/today`）、`inbox`（`GET me/inbox[?mark=1]`）、`link`（`POST me/links`）、`chat`（`GET me/chats`、`GET me/chats/{n}`）、`chat.send`（`POST me/chats/{n}`）、`posts`（`GET me/posts`）、`posts.write`（`POST me/posts`，只能发文字）。
- 每个令牌每天另有上限：读 1000 次、连线 20 次、私聊 100 条、发星友圈 5 条，超了 `429 too_many`。
- 写操作（`link`、`chat.send`、`posts.write`、`maps.rate`）只在玩家自己点的时候发，不自动连线、不群发。账号操作不在接口里，以后也不会有。
- 「我登记的网站」改名「我登记的应用」：一次登记可以是网站也可以是客户端；回调地址可以不填（不填只能走设备授权）。
- 自助登记的应用什么权限都能要（不写还是只有 `profile`），之前「网站不能要星轨相交和互相连上」的限制去掉了。同意页写「玩家自行登记，未经星遇同频审核」，玩家的列表里标「未审核」。

## 2026-10-25 · 按项授权（权限 scope）

- 每个令牌带一串权限：`profile`（总有）、`vrchat`、`card`、`maps`、`maps.rate`、`notifications`、`crossings`、`mutuals`。调没有权限的 `me/…` 回答 `403` `{"error": "scope", "need": …}`。
- 设备授权：`device/code` 可以带 `scope`，不写就是 `profile notifications crossings mutuals maps maps.rate`（和以前能做的一样）；不认识的回答 `400 invalid_scope`。`device/code` 和 `device/token` 的回答多了 `scope`。旧的连接码也给这一串。
- 用星遇同频登录：`/oauth/authorize` 可以带 `scope`，不写只有 `profile`；网站最多 `profile vrchat card maps maps.rate notifications`，不能要星轨相交和互相连上。`user.vrc` 现在要有 `vrchat` 权限才给。
- 网站可以用令牌和自己的 `client_id`（当 `X-Client`）从服务器调权限内的 `me/…`；登记期间 `client_id` 在所有 `/api/v1` 接口都能当标识用。
- 令牌只能配发给它的那个 `X-Client` 用，不一致回答 `403 client_mismatch`。
- `device/token` 的 `me.vrc` 只在有 `vrchat` 权限时给，否则是 `null`；第三方客户端用连接码 `connect` 连上时 `me.vrc` 是 `null`。
- 先查令牌和 `X-Client` 配不配（`client_mismatch`），再查权限（`scope`）。
- 同意页文案定稿：客户端写「连接后，它可以：」，按钮「取消 / 同意连接」；网站写「登录后，该网站可以：」。每项权限的说法见 README「权限」一节。
- 网站也能走设备授权，权限上限和登录一样（不写只有 `profile`，要 `crossings` / `mutuals` 回答 `400 invalid_scope`），同意页显示网站登记的名称。
- 同意页把要的每一项列成一行，不折叠，不能逐项取消。只要用得到的。
- 新接口：`GET me/card`（星卡，`card`）、`GET me/maps`（打过分的地图，`maps`，算在每天 300 次里）。
- 示例：`client.mjs` 的 `login` 可以指定权限，加了 `card`、`mymaps`；`login-site.mjs` 可以用 `SCOPE` 指定权限。

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
