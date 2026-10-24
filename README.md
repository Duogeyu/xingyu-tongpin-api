# 星遇同频 · 客户端接口

[星遇同频](https://vrcc.cc/match/) 给 VRChat 客户端用的接口。我们自己的 [VRCX 脚本](https://github.com/Duogeyu/xingyu-tongpin-vrcx) 用的就是这一套；你在用别的客户端（比如 VRCX 的分支），可以照着这里自己做适配。

能做的事和 VRCX 脚本一样：

- 收星遇同频的提醒，看最近的提醒
- 看和你星轨相交的星、互相连上的星
- 看你所在地图在地图榜上的样子，给它打分、写一句短评
- 断开连接

接口只读写这位玩家自己的东西，范围和网页上一样，不会因为换了客户端而多给。

## 使用要求

用这套接口的客户端，都要做到下面这些。做不到的，我们会停用它。

1. **先登记。** 在本仓库开一个 issue，标题写「登记客户端」，写清：客户端叫什么、你给它定的 `client` 标识、源码在哪、用了哪些接口、拿来做什么、怎么联系你。我们核对后把标识加进名单，你的客户端才能正式使用。
2. **源码公开。** 玩家要能看到你的客户端拿令牌做了什么。
3. **每个请求都带 `client`。** 用登记过的标识，不冒充别的客户端，也不冒充我们的 VRCX 脚本（不带 `client` 的请求算作 VRCX 脚本）。开发、自测时用 `dev-` 开头的标识，比如 `dev-myclient`；正式发布前要登记。
4. **令牌只发给 vrcc.cc。** 连接码和提醒令牌只存在玩家自己的电脑上，只发往 `https://vrcc.cc/api/match`，不经过你或任何第三方的服务器。
5. **数据只给这位玩家看。** 不转存、不上传、不汇总、不分享，不拿来做统计、排行或别的玩家看得到的东西。互相连上的人的 VRChat 名字尤其如此。
6. **打分只在玩家自己点的时候发。** 不自动打分，不批量打分。
7. **写明是第三方。** 界面上说清这是第三方客户端，不是星遇同频官方；连接、断开都由玩家自己操作，随时能断开。
8. **守频率。** 拉提醒每分钟最多一次；收到 429 就按回答里的 `every` 或至少一分钟后再试。见下面「频率」。
9. **不绕过检查。** 发现安全问题，在本仓库的 Security 页私下报告，不要开公开 issue。

我们可以随时把某个客户端从名单里拿掉，接口也可能调整；要改的地方会提前写在本仓库的 [CHANGELOG](CHANGELOG.md)。

玩家每次在新客户端连上，星遇同频都会发一条站内通知，写明是哪个客户端；「我的资料 → 在 VRCX 里提醒」也会显示当前连着的是哪个。

## 怎么连上

1. 玩家在星遇同频「我的资料 → 在 VRCX 里提醒」拿到连接码（8 位，10 分钟内有效，只能用一次）。
2. 你的客户端把连接码发给 `POST ?vrcx-pair`，换回**提醒令牌**（48 位十六进制）。之后所有请求都用它。
3. 断开时发 `POST ?vrcx-off`，令牌立刻失效。

**每颗星同一时间只有一个连接。** 新连上的会让之前的令牌失效：玩家在你的客户端里连上以后，原来 VRCX 里的就断了，反过来也一样。

## 请求的样子

- 地址：`https://vrcc.cc/api/match`，后面跟查询参数。
- `GET` 直接带参数。`POST` 的正文是 JSON 文字，请求头用 `Content-Type: text/plain`（不用 `application/json`），这样浏览器里不会先发预检请求。
- 回答都是 JSON。出错时 HTTP 状态码不是 2xx，正文是 `{"error": "…"}`。
- 每个请求都带 `v=4`（协议版本）和 `client=<你的标识>`；`POST` 把 `client` 放进正文。

从浏览器页面里发请求的客户端（比如 Tauri 做的）：只有这些来源能读到回答——`tauri://localhost`、`http(s)://tauri.localhost`、`null`（本地文件页面）、`http://localhost` / `http://127.0.0.1`（开发时）。从程序里直接发请求（Rust、Node、Python 等）不受这个限制。

## 接口

下面的 `{token}` 是提醒令牌，`{client}` 是你的标识。完整的字段和类型见 [openapi.yaml](openapi.yaml)（三个 POST 在里面写成 `/api/match/vrcx-pair` 这样的路径，实际请求是 `?vrcx-pair`，文件开头有说明）。

### 连接：`POST ?vrcx-pair`

```json
{ "code": "ABCD2345", "client": "dev-myclient" }
```

连接码里的空格、横线会被忽略，不分大小写。回答：

```json
{ "token": "3f…（48 位）", "me": { "star": 128, "vrc": "玩家的 VRChat 名字" } }
```

`me.star` 是星号，没有点亮编号时是 `null`。

| 状态 | `error` | 意思 |
| --- | --- | --- |
| 404 | `code` | 连接码不对、过期或已经用过 |
| 403 | `client_unknown` | `client` 不在名单里，也不是 `dev-` 开头 |
| 429 | `too_many` | 这个网络今天试得太多了 |
| 429 | `busy` | 今天全站错的连接码太多，连接暂停到明天 |

### 拉提醒：`GET ?vrcx={token}&v=4&client={client}&since={last}`

VRChat 开着时每分钟问一次。第一次不带 `since`：只告诉你现在到哪了（`last`），不给旧提醒；之后带上一次的 `last`。

```json
{ "last": 1042, "items": [{ "id": 1042, "title": "星遇同频", "body": "有人连向了你", "at": 1792830000000 }], "every": 60, "dot": 2, "latest": 4 }
```

- `items`：`since` 之后的新提醒，最多 5 条，旧的在前；只保留一天。
- `every`：建议多少秒问一次。
- `dot`：星轨相交里还没看过的人数，可以当红点。
- `latest`：我们 VRCX 脚本的最新版本号，别的客户端可以不管。
- `v` 低于 2 时回答 `{"old": true}`。

| 状态 | `error` | 意思 |
| --- | --- | --- |
| 404 | `gone` | 令牌失效（断开了、在别处连上了、星被删除）。停下，让玩家重新连接 |
| 429 | `too_soon` | 离上一次不到 25 秒；按 `every` 再来 |
| 403 | `client_unknown` | 同上 |

### 星轨相交：`GET ?vrcx={token}&v=4&client={client}&view=cross[&mark=1]`

和网页「连向我 → 星轨相交」一样的列表。带 `mark=1` 表示玩家看过了，红点消掉（记在账号上，网页也跟着消）。

```json
{
  "stars": [{ "n": 77, "name": "拾光旅人", "line": "放慢脚步逛世界……", "group": "G", "star": 31, "intro": "介绍的前 60 个字",
              "vrc": null, "linked": true, "mutual": false, "at": 1792830000000, "fresh": true }],
  "n": 1, "why": null, "me": { "star": 128, "vrc": "玩家的 VRChat 名字" }
}
```

- `n`（每颗星里的）：星的编号，在浏览器里打开这颗星用 `https://vrcc.cc/match/?tab=inbox&cross={n}`；`star`：点亮编号（对方没公开时是 `null`）。
- `name` / `line`：星位名和一句描述；`group`：星群，`G` 漫游、`W` 游戏、`Z` 创作、`L` 聊天、`A` 万象。
- `vrc`：只有互相连上（`mutual`）时才给 VRChat 名字。
- `why`：列表为什么是空的或用不了。`null` 正常；`hide` 不给这位玩家看（不显示这一块）；`verify` 还没验证 VRChat 账号；`wait` 验证中；`queued` / `sent` 机器人的好友请求排队中 / 已发出，等玩家同意；`gone` / `friend` 玩家删了或关了机器人好友。

### 互相连上：`GET ?vrcx={token}&v=4&client={client}&view=mutual`

```json
{ "stars": [{ "n": 77, "name": "拾光旅人", "group": "G", "star": 31, "vrc": "对方的 VRChat 名字", "vrcUser": "usr_…", "at": 1792830000000 }], "n": 1 }
```

`vrcUser` 只在对方验证过、并且公开了「已验证」时才有。加好友请打开客户端自己的玩家页面，让玩家自己点，不要替玩家向 VRChat 发请求。

### 最近的提醒：`GET ?vrcx={token}&v=4&client={client}&view=recent[&mark=1]`

```json
{ "items": [{ "id": 1042, "title": "星遇同频", "body": "有人连向了你", "url": "/match/?tab=inbox", "at": 1792830000000 }], "read": 1040 }
```

最近一天的最后 5 条，新的在前。`url` 是 `https://vrcc.cc` 下的页面（可能是 `null`）；`read` 是玩家最后看过的那条，带 `mark=1` 表示现在看过了。

### 地图：`GET ?vrcx={token}&v=4&client={client}&view=map&world={wrld_…}`

`world` 是玩家所在地图的 ID（只要 `wrld_…`，不要房间号）。

```json
{ "world": "wrld_…", "name": "地图名", "board": true, "pending": false, "off": false, "avg": 8.6, "raters": 12,
  "mine": 9, "can": true, "need": null, "words": "我写的短评", "wordsOk": "ok", "img": "/api/match?xdimg=wrld_…" }
```

- `board`：在地图榜上（网页：`https://vrcc.cc/match/?map={world}`）；`pending`：加上了但还在审核；`off`：不给这位玩家看（这时不要显示）。都不是：地图榜上还没有，玩家打分时会由他添加。
- `mine`：玩家打过的分；`words` / `wordsOk`：玩家自己的短评和审核状态（`wait` 审核中、`ok` 通过、`hidden` 没通过）。
- `can`：现在能不能打分；不能时 `need` 说缺什么：`verify` 先验证 VRChat 账号，`friend` 先同意机器人的好友请求，`go` 要先在这张地图上待一会儿。
- `img`：地图榜上的封面，接在 `https://vrcc.cc` 后面。

### 打分：`POST ?vrcx-map`

```json
{ "token": "…", "client": "dev-myclient", "world": "wrld_…", "score": 9, "text": "一句短评（可以不带）" }
```

`score` 是 1–10。`text` 最多 30 字，和网页一样要经过检查；带空字符串表示删掉短评，不带就只改分。回答和「地图」一样。

| 状态 | `error` | 意思 |
| --- | --- | --- |
| 403 | `map_not_went` | 还不能打分，`need` 说缺什么 |
| 403 | `map_elsewhere` | 机器人看到玩家现在在别的地图 |
| 403 | `map_off` / `xd_world_no` | 这张地图不给打分 / 不给这位玩家看 |
| 400 | `yq_words` | 短评没通过，`why` 是原因 |
| 400 | `yq_empty` | 短评只有符号 |
| 429 | `too_many` | 今天打分或添加地图太多了 |

### 断开：`POST ?vrcx-off`

```json
{ "token": "…" }
```

回答 `{"ok": true}`。令牌立刻失效，玩家的待收提醒也清掉。

## 频率

| 什么 | 限制 |
| --- | --- |
| 拉提醒 | 两次之间至少 25 秒，建议按 `every`（60 秒）；只在 VRChat 开着时拉 |
| 星轨相交、互相连上、最近的提醒、地图 | 加起来每颗星每天 300 次 |
| 连接 | 每个网络每天 30 次 |
| 打分 | 和网页地图榜共用每天的次数 |

## 示例

[examples/client.mjs](examples/client.mjs) 是一个最小的 Node.js 客户端（Node 18 以上），从连接到拉提醒、打分都有：

```bash
node examples/client.mjs pair ABCD2345
node examples/client.mjs poll
```

## 协议

文档和示例代码用 [MIT](LICENSE)。「星遇同频」「VRChat 中文社区」的名字和图标不在授权里，你的客户端不能用它们装成官方。
