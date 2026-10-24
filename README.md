# 星遇同频 · 开放接口

[星遇同频](https://vrcc.cc/match/) 的开放接口，地址都在 `https://vrcc.cc/api/v1/` 下面。两类：

- **开放数据**：地图榜这类所有人都能看的榜单，不用登录。可以拿来做 VRChat 世界里的地图榜组件、网站、机器人。
- **玩家自己的**：玩家在你的客户端里连上星遇同频以后，收提醒、看星轨相交和互相连上的星、给所在地图打分。我们自己的 [VRCX 脚本](https://github.com/Duogeyu/xingyu-tongpin-vrcx) 做的就是这些；你在用别的客户端（比如 VRCX 的分支），可以照着这里自己适配。

接口只给网页上本来就能看到的东西：开放数据和公开的 [地图榜页面](https://vrcc.cc/maps/) 一样；玩家自己的只给这位玩家本人，范围和网页上一样。

## 使用要求

用这套接口的客户端、组件和程序，都要做到下面这些。做不到的，我们会停用它。

1. **先登记。** 在本仓库开一个 issue，标题写「登记客户端」，写清：叫什么、你给它定的 `client` 标识、源码或世界在哪、用了哪些接口、拿来做什么、怎么联系你。我们核对后把标识加进名单，才能正式使用。开发、自测时用 `dev-` 开头的标识，比如 `dev-mywidget`；正式发布前要登记。
2. **每个请求都带 `client`。** 用登记过的标识，不冒充别人。
3. **守频率。** 见下面「频率」；收到 429 就等一分钟再试。开放数据会变的很慢，取一次用一阵，不要每秒都问。
4. **不绕过检查。** 发现安全问题，在本仓库的 Security 页私下报告，不要开公开 issue。

用到玩家自己的接口的，还要做到：

5. **源码公开。** 玩家要能看到你的客户端拿令牌做了什么。
6. **令牌只发给 vrcc.cc。** 连接码和令牌只存在玩家自己的电脑上，只发往 `https://vrcc.cc/api/v1/`，不经过你或任何第三方的服务器。
7. **数据只给这位玩家看。** 不转存、不上传、不汇总、不分享，不拿来做统计、排行或别的玩家看得到的东西。互相连上的人的 VRChat 名字尤其如此。
8. **打分只在玩家自己点的时候发。** 不自动打分，不批量打分。
9. **写明是第三方。** 界面上说清这是第三方客户端，不是星遇同频官方；连接、断开都由玩家自己操作，随时能断开。

我们可以随时停用某个标识，接口也可能调整；要改的地方会提前写在本仓库的 [CHANGELOG](CHANGELOG.md)。玩家每次在新客户端连上，星遇同频都会发一条站内通知，写明是哪个客户端；「我的资料 → 在 VRCX 里提醒」也会显示当前连着的是哪个。

## 请求的样子

- 地址：`https://vrcc.cc/api/v1/` 加下面的路径。
- 客户端标识：请求头 `X-Client: <标识>`。发不了请求头的（比如 VRChat 世界里的 Udon），放在网址里：`?client=<标识>`。
- 玩家自己的接口：请求头 `Authorization: Bearer <令牌>`。令牌不放进网址。
- `POST` 的正文是 JSON。
- 回答都是 JSON。出错时 HTTP 状态码不是 2xx，正文是 `{"error": "…"}`。

| 状态 | `error` | 意思 |
| --- | --- | --- |
| 403 | `client_missing` | 没带 `client` |
| 403 | `client_unknown` | `client` 不在名单里，也不是 `dev-` 开头 |
| 403 | `client_off` | 这个标识被停用了 |
| 429 | `too_many` | 问得太快或今天次数用完，一分钟后再试 |
| 401 | `token` | 玩家自己的接口没带令牌 |
| 404 | `gone` | 令牌失效（断开了、在别处连上了、星被删除）：停下，让玩家重新连接 |
| 404 | `not_found` | 没有这个接口，或地图不在榜上 |

从浏览器页面里发请求的客户端（比如 Tauri 做的）：只有这些来源能读到回答——`tauri://localhost`、`http(s)://tauri.localhost`、`null`（本地文件页面）、`http://localhost` / `http://127.0.0.1`（开发时）。网站不行。从程序里直接发请求（Rust、Node、Python 等）不受这个限制。

完整的字段和类型见 [openapi.yaml](openapi.yaml)。

## 开放数据：地图榜

数据和 [vrcc.cc/maps/](https://vrcc.cc/maps/) 一样：通过审核的地图、平均分、几人评分、名次。不给谁打了分，也不给短评。最多 5 分钟更新一次。

### 排行：`GET /api/v1/boards/maps?limit=20`

满 5 人评分的地图，按名次排，`limit` 1–100。

```json
{ "board": "maps", "min": 5, "at": 1792830000000,
  "maps": [{ "world": "wrld_…", "name": "地图名", "author": "作者", "avg": 9.1, "raters": 9, "rank": 1, "weight": "light",
             "page": "https://vrcc.cc/maps/wrld_…", "img": "https://vrcc.cc/maps/wrld_….jpg" }] }
```

- `avg`：1–10 分的平均分（一位小数）；`raters`：几人评分；`rank`：总榜名次（不满 5 人时为 `null`）。
- `weight`：多小咕实测的轻重，`light` 轻量、`mid` 中等、`heavy` 较重，没测过是 `null`。
- `page`：地图在地图榜上的页面；`img`：封面图。

### 查几张地图：`GET /api/v1/maps?ids=wrld_…,wrld_…`

一次最多 20 张，回答里只有在榜上的。字段同上。

### 查一张地图：`GET /api/v1/maps/{world}`

回答 `{"map": {…}, "at": …}`；不在榜上是 404 `not_found`。

### 在 VRChat 世界里用

- Udon 用 `VRCStringDownloader` 读文字，地址带上 `?client=你的标识`，例如 `https://vrcc.cc/api/v1/boards/maps?limit=10&client=dev-mywidget`；回答用 `VRCJson` 解析。
- 封面用 `VRCImageDownloader` 读 `img`。
- vrcc.cc 不在 VRChat 默认信任的域名里，玩家要在 VRChat 设置里打开「允许不受信任的网址」（Allow Untrusted URLs）才能读到。世界里写一句提示。
- VRChat 限制每个世界 5 秒最多下载一次。进世界时取一次就够，榜单不会变得那么快。
- 在世界里注明「数据来自星遇同频地图榜（vrcc.cc）」。

## 玩家自己的

### 怎么连上

1. 玩家在星遇同频「我的资料 → 在 VRCX 里提醒」拿到连接码（8 位，10 分钟内有效，只能用一次）。
2. 你的客户端把连接码发给 `POST /api/v1/connect`，换回**令牌**（48 位十六进制）。之后的请求都在请求头里带它。
3. 断开时发 `POST /api/v1/disconnect`，令牌立刻失效。

**每颗星同一时间只有一个连接。** 新连上的会让之前的令牌失效：玩家在你的客户端里连上以后，原来 VRCX 里的就断了，反过来也一样。

### 连接：`POST /api/v1/connect`

```json
{ "code": "ABCD2345" }
```

连接码里的空格、横线会被忽略，不分大小写。回答 `{"token": "…", "me": {"star": 128, "vrc": "玩家的 VRChat 名字"}}`；`me.star` 是点亮编号，没有时是 `null`。连接码不对、过期或用过：404 `code`；这个网络今天试得太多：429 `too_many`；今天全站错的连接码太多，连接暂停到明天：429 `busy`。

### 断开：`POST /api/v1/disconnect`

回答 `{"ok": true}`。令牌立刻失效，待收的提醒也清掉。

### 提醒：`GET /api/v1/me/notifications?since={last}`

VRChat 开着时每分钟问一次。第一次不带 `since`：只告诉你现在到哪了（`last`），不给旧提醒；之后带上一次的 `last`。

```json
{ "last": 1042, "items": [{ "id": 1042, "title": "星遇同频", "body": "有人连向了你", "at": 1792830000000 }], "every": 60, "dot": 2 }
```

- `items`：`since` 之后的新提醒，最多 5 条，旧的在前；只保留一天。
- `every`：建议多少秒问一次；离上一次不到 25 秒是 429 `too_soon`。
- `dot`：星轨相交里还没看过的人数，可以当红点。

### 最近的提醒：`GET /api/v1/me/notifications/recent[?mark=1]`

```json
{ "items": [{ "id": 1042, "title": "星遇同频", "body": "有人连向了你", "url": "/match/?tab=inbox", "at": 1792830000000 }], "read": 1040 }
```

最近一天的最后 5 条，新的在前。`url` 是 `https://vrcc.cc` 下的页面（可能是 `null`）；`read` 是玩家最后看过的那条，带 `mark=1` 表示现在看过了（记在账号上）。

### 星轨相交：`GET /api/v1/me/crossings[?mark=1]`

和网页「连向我 → 星轨相交」一样的列表。带 `mark=1` 表示玩家看过了，红点消掉。

```json
{ "stars": [{ "n": 77, "name": "拾光旅人", "line": "放慢脚步逛世界……", "group": "G", "star": 31, "intro": "介绍的前 60 个字",
              "vrc": null, "linked": true, "mutual": false, "at": 1792830000000, "fresh": true }],
  "n": 1, "why": null, "me": { "star": 128, "vrc": "玩家的 VRChat 名字" } }
```

- `n`（每颗星里的）：星的编号，在浏览器里打开这颗星用 `https://vrcc.cc/match/?tab=inbox&cross={n}`；`star`：点亮编号（对方没公开时是 `null`）。
- `name` / `line`：星位名和一句描述；`group`：星群，`G` 漫游、`W` 游戏、`Z` 创作、`L` 聊天、`A` 万象。
- `vrc`：只有互相连上（`mutual`）时才给 VRChat 名字。
- `why`：`null` 正常；`hide` 不给这位玩家看（不显示这一块）；`verify` 还没验证 VRChat 账号；`wait` 验证中；`queued` / `sent` 机器人的好友请求排队中 / 已发出，等玩家同意；`gone` / `friend` 玩家删了或关了机器人好友。

### 互相连上：`GET /api/v1/me/mutuals`

```json
{ "stars": [{ "n": 77, "name": "拾光旅人", "group": "G", "star": 31, "vrc": "对方的 VRChat 名字", "vrcUser": "usr_…", "at": 1792830000000 }], "n": 1 }
```

`vrcUser` 只在对方验证过、并且公开了「已验证」时才有。加好友请打开客户端自己的玩家页面，让玩家自己点，不要替玩家向 VRChat 发请求。

### 所在的地图：`GET /api/v1/me/maps/{world}`

`world` 是玩家所在地图的 ID（只要 `wrld_…`，不要房间号）。

```json
{ "world": "wrld_…", "name": "地图名", "board": true, "pending": false, "off": false, "avg": 8.6, "raters": 12,
  "mine": 9, "can": true, "need": null, "words": "我写的短评", "wordsOk": "ok", "img": "/api/match?xdimg=wrld_…" }
```

- `board`：在地图榜上；`pending`：加上了但还在审核；`off`：不给这位玩家看（这时不要显示）。都不是：地图榜上还没有，玩家打分时会由他添加。
- `mine`：玩家打过的分；`words` / `wordsOk`：玩家自己的短评和审核状态（`wait` 审核中、`ok` 通过、`hidden` 没通过）。
- `can`：现在能不能打分；不能时 `need` 说缺什么：`verify` 先验证 VRChat 账号，`friend` 先同意机器人的好友请求，`go` 要先在这张地图上待一会儿。
- `img`：封面，接在 `https://vrcc.cc` 后面。

### 打分：`POST /api/v1/me/maps/{world}/rating`

```json
{ "score": 9, "text": "一句短评（可以不带）" }
```

`score` 是 1–10。`text` 最多 30 字，和网页一样要经过检查；带空字符串表示删掉短评，不带就只改分。回答和「所在的地图」一样。

| 状态 | `error` | 意思 |
| --- | --- | --- |
| 403 | `map_not_went` | 还不能打分，`need` 说缺什么 |
| 403 | `map_elsewhere` | 机器人看到玩家现在在别的地图 |
| 403 | `map_off` / `xd_world_no` | 这张地图不给打分 / 不给这位玩家看 |
| 400 | `yq_words` | 短评没通过，`why` 是原因 |
| 400 | `yq_empty` | 短评只有符号 |
| 429 | `too_many` | 今天打分或添加地图太多了 |

## 频率

| 什么 | 限制 |
| --- | --- |
| 每个网络地址 | 每分钟 120 次左右 |
| 提醒 | 两次之间至少 25 秒，建议按 `every`（60 秒）；只在 VRChat 开着时问 |
| 最近的提醒、星轨相交、互相连上、所在的地图 | 加起来每颗星每天 300 次 |
| 连接 | 每个网络每天 30 次 |
| 打分 | 和网页地图榜共用每天的次数 |
| 开放数据 | 最多 5 分钟更新一次，问得再勤也是同一份 |

## 示例

[examples/client.mjs](examples/client.mjs) 是一个最小的 Node.js 客户端（Node 18 以上，没有依赖）：

```bash
node examples/client.mjs top                 # 地图榜前 10
node examples/client.mjs pair ABCD2345       # 连上
node examples/client.mjs poll                # 每分钟拉一次提醒
```

## 授权

文档和示例代码用 [MIT](LICENSE)。开放数据（地图榜）可以自由使用，用的时候注明「数据来自星遇同频地图榜（vrcc.cc）」。地图名、作者和封面来自 VRChat，归各自的作者。「星遇同频」「VRChat 中文社区」的名字和图标不在授权里，不能用来装成官方。

## 旧的接口

我们的 VRCX 脚本（v4 及以前）用的是 `https://vrcc.cc/api/match?vrcx=…` 那一套，令牌放在网址里。它还能用，但只给我们自己的脚本；新的客户端请用 `/api/v1/`。
