# 星遇同频 · 开放接口

**[📖 在线交互式 API 文档 (API Wiki)](https://docs.vrcc.cc/)** · **[OpenAPI 规范 (`openapi.yaml`)](openapi.yaml)** · **[最小示例 (`examples/client.mjs`)](examples/client.mjs)** · **[更新记录 (`CHANGELOG.md`)](CHANGELOG.md)**

---

[星遇同频](https://vrcc.cc/match/) 的开放接口，地址都在 `https://vrcc.cc/api/v1/` 下面。接口只给网页上本来就能看到的东西，分两类：

| 类别 | 是否需要令牌 | 适用场景 | 数据范围 |
| --- | --- | --- | --- |
| **开放数据** | 不用登录（仅需 `client` 标识） | VRChat 世界里的地图榜组件、社区网站、机器人 | 和公开的 [地图榜页面](https://vrcc.cc/maps/) 一样：过审地图、平均分、几人评分、名次、性能轻重（不含谁打的分和短评） |
| **玩家自己的** | 需要令牌（`Authorization: Bearer`） | 桌面客户端（如官方 [VRCX 脚本](https://github.com/vrcc-cc/xingyu-tongpin-vrcx)、VRCX 分支、Tauri 工具） | 只给这位玩家本人，范围和网页上一样：收提醒、看星轨相交和互相连上的星、给所在地图打分 |

## 目录

- [接口速查表](#接口速查表)
- [使用要求（必读）](#使用要求)
- [快速开始与接入流程](#快速开始与接入流程)
- [请求规范与通用错误](#请求规范与通用错误)
- [开放数据：地图榜](#开放数据地图榜)
- [玩家自己的接口](#玩家自己的接口)
- [频率限制](#频率限制)
- [最小示例](#示例)
- [授权与旧接口](#授权)

---

## 接口速查表

| 分类 | 方法 | 路径 | 认证 | 说明 |
| --- | --- | --- | --- | --- |
| **地图榜** | `GET` | [`/api/v1/boards/maps`](#排行get-apiv1boardsmapslimit20) | `client` | 地图榜总榜排行（满 5 人评分，按名次排，`limit` 1–100） |
| **地图榜** | `GET` | [`/api/v1/maps`](#查几张地图get-apiv1mapsids) | `client` | 按世界 ID 批量查几张地图（最多 20 张，只返回在榜上的） |
| **地图榜** | `GET` | [`/api/v1/maps/{world}`](#查一张地图get-apiv1mapsworld) | `client` | 查单张地图在地图榜上的数据 |
| **连接** | `POST` | [`/api/v1/connect`](#连接post-apiv1connect) | `client` | 用 8 位一次性连接码连上，换取 48 位令牌 |
| **连接** | `POST` | [`/api/v1/disconnect`](#断开post-apiv1disconnect) | `client` + `Bearer` | 断开连接，令牌立刻失效并清掉待收提醒 |
| **玩家本人** | `GET` | [`/api/v1/me/notifications`](#提醒get-apiv1menotificationssincelast) | `client` + `Bearer` | 轮询新提醒与星轨相交未读红点（建议每 60 秒一次） |
| **玩家本人** | `GET` | [`/api/v1/me/notifications/recent`](#最近的提醒get-apiv1menotificationsrecentmark1) | `client` + `Bearer` | 最近一天的最后 5 条提醒（带页面跳转路径，支持标已读） |
| **玩家本人** | `GET` | [`/api/v1/me/crossings`](#星轨相交get-apiv1mecrossingsmark1) | `client` + `Bearer` | 「星轨相交」擦肩列表（支持标已读消红点） |
| **玩家本人** | `GET` | [`/api/v1/me/mutuals`](#互相连上get-apiv1memutuals) | `client` + `Bearer` | 「互相连上」的星列表（含对方的 VRChat 名字与可选用户 ID） |
| **玩家本人** | `GET` | [`/api/v1/me/maps/{world}`](#所在的地图get-apiv1memapsworld) | `client` + `Bearer` | 玩家当前所在地图在榜上的状态、本人评分与短评 |
| **玩家本人** | `POST` | [`/api/v1/me/maps/{world}/rating`](#打分post-apiv1memapsworldrating) | `client` + `Bearer` | 给当前所在的地图打分（1–10 分）及写短评（最多 30 字） |

> 💡 想要在线调试请求或复制各语言代码（cURL / JS / Python / Rust / C#），请直接打开 **[在线交互式 API 文档 (API Wiki)](https://docs.vrcc.cc/)**。

---

## 使用要求

用这套接口的客户端、组件和程序，都要做到下面这些。做不到的，我们会停用它。

### 所有调用方通用要求

1. **先登记。** 在本仓库 [开一个 Issue](https://github.com/vrcc-cc/xingyu-tongpin-api/issues/new?title=%E7%99%BB%E8%AE%B0%E5%AE%A2%E6%88%B7%E7%AB%AF%EF%BC%9A)，标题写「登记客户端」，写清：
   - 叫什么名字
   - 你给它定的 `client` 标识
   - 源码或 VRChat 世界在哪
   - 用了哪些接口、拿来做什么
   - 怎么联系你
   
   我们核对后把标识加进名单，才能正式使用。**开发、自测时用 `dev-` 开头的标识**（比如 `dev-mywidget`）；正式发布前必须登记。
2. **每个请求都带 `client`。** 用登记过的标识，不冒充别人。
3. **守频率。** 见下面「[频率限制](#频率限制)」；收到 `429` 就等一分钟再试。开放数据变得很慢，取一次用一阵，不要每秒都问。
4. **不绕过检查。** 发现安全问题，在本仓库的 Security 页私下报告，不要开公开 Issue。

### 用到「玩家自己的接口」还要做到

5. **源码公开。** 玩家要能看到你的客户端拿令牌做了什么。
6. **令牌只发给 `vrcc.cc`。** 连接码和令牌只存在玩家自己的电脑上，只发往 `https://vrcc.cc/api/v1/`，不经过你或任何第三方的服务器。
7. **数据只给这位玩家看。** 不转存、不上传、不汇总、不分享，不拿来做统计、排行或别的玩家看得到的东西。**互相连上的人的 VRChat 名字尤其如此。**
8. **打分只在玩家自己点的时候发。** 不自动打分，不批量打分。
9. **写明是第三方。** 界面上说清这是第三方客户端，不是星遇同频官方；连接、断开都由玩家自己操作，随时能断开。

> [!IMPORTANT]
> 我们可以随时停用某个标识，接口也可能调整；要改的地方会提前写在本仓库的 [CHANGELOG](CHANGELOG.md)。玩家每次在新客户端连上，星遇同频都会发一条站内通知，写明是哪个客户端；网页「我的资料 → 在 VRCX 里提醒」也会显示当前连着的是哪个。

---

## 快速开始与接入流程

### 场景一：拉取开放数据（地图榜）

开放数据无需玩家登录，只要在请求头带 `X-Client`（或在网址里带 `?client=`）：

```bash
curl -H "X-Client: dev-example" "https://vrcc.cc/api/v1/boards/maps?limit=10"
```

### 场景二：在 VRChat 世界里做地图榜组件（Udon）

VRChat 世界里的 Udon 脚本发不了自定义请求头，可以把标识放在网址的 `?client=` 参数里：

```
https://vrcc.cc/api/v1/boards/maps?limit=10&client=dev-mywidget
```

- **拉取数据**：Udon 用 `VRCStringDownloader` 读文字，回答用 `VRCJson` 解析；封面图用 `VRCImageDownloader` 读 `img`。
- **允许不受信任的网址**：`vrcc.cc` 不在 VRChat 默认信任的域名里，玩家要在 VRChat 设置里打开「**允许不受信任的网址**」（Allow Untrusted URLs）才能读到，请在世界里写一句提示。
- **冷却限制**：VRChat 限制每个世界 5 秒最多下载一次。进世界时取一次就够，榜单最多 5 分钟才更新一次。
- **数据署名**：请在世界里注明「**数据来自星遇同频地图榜（vrcc.cc）**」。

### 场景三：适配桌面客户端（连接码配对与轮询生命周期）

```mermaid
sequenceDiagram
    autonumber
    actor Player as 玩家
    participant Web as 星遇同频网页<br/>(vrcc.cc/match)
    participant App as 你的客户端<br/>(X-Client: xxx)
    participant API as 星遇同频 API<br/>(/api/v1)

    Player->>Web: 打开「我的资料 → 在 VRCX 里提醒」
    Web-->>Player: 生成 8 位一次性连接码 (10 分钟有效)
    Player->>App: 输入连接码 (如 ABCD2345)
    App->>API: POST /connect { "code": "ABCD2345" }
    API-->>App: 返回 48 位 token 与 me 信息（旧连接立即失效）
    Note over App: 将 token 保存在玩家本机

    rect rgb(15, 20, 32)
        Note over App,API: VRChat 运行期间：每分钟轮询提醒
        App->>API: GET /me/notifications (首次不带 since)
        API-->>App: { "last": 1042, "items": [], "every": 60, "dot": 2 }
        loop 按返回的 every 秒数（如 60 秒）等待
            App->>API: GET /me/notifications?since=1042
            API-->>App: { "last": 1043, "items": [...], "every": 60, "dot": 2 }
        end
    end

    opt 玩家打开面板或切地图时按需请求
        App->>API: GET /me/crossings | /me/mutuals | /me/maps/{world}
        App->>API: POST /me/maps/{world}/rating (仅当玩家主动点击打分时)
    end

    Player->>App: 点击「断开连接」
    App->>API: POST /disconnect
    API-->>App: { "ok": true }（令牌立刻失效）
```

> [!WARNING]
> **每颗星同一时间只有一个连接。** 新连上的会让之前的令牌失效：玩家在你的客户端里连上以后，原来 VRCX 里的就断了，反过来也一样。当轮询或请求收到 `404`（`{"error": "gone"}`）时，说明令牌已失效，请立即停止轮询并让玩家重新连接。

---

## 请求规范与通用错误

- **基础地址**：`https://vrcc.cc/api/v1/` 加下面的路径。
- **客户端标识**：请求头 `X-Client: <标识>`。发不了请求头的（比如 VRChat 世界里的 Udon），在开放数据接口放在网址里：`?client=<标识>`。
- **玩家自己的接口**：请求头 `Authorization: Bearer <令牌>`。**令牌绝不能放进网址。**
- **请求与响应格式**：`POST` 的正文是 JSON（最大 2 KB）；所有回答都是 JSON。出错时 HTTP 状态码不是 `2xx`，正文是 `{"error": "…"}`。

### 通用错误码

| HTTP 状态 | `error` | 意思与处理方式 |
| :---: | --- | --- |
| `403` | `client_missing` | 请求没带 `client` 标识 |
| `403` | `client_unknown` | `client` 不在登记白名单里，也不是 `dev-` 开头 |
| `403` | `client_off` | 这个 `client` 标识已被停用 |
| `429` | `too_many` | 问得太快或今天次数用完，等至少一分钟后再试 |
| `401` | `token` | 玩家自己的接口没带令牌，或令牌格式不对 |
| `404` | `gone` | **令牌失效**（断开了、在别处连上了、星被删除）：停下轮询，让玩家重新连接 |
| `404` | `not_found` | 没有这个接口，或查询的地图不在榜上 |
| `400` | `bad_request` | 请求参数或 JSON 格式不对 |
| `413` | `too_large` | `POST` 正文超过 2 KB |

### 桌面客户端页面的跨域（CORS）说明

- **从浏览器/WebView 页面里直接发请求**的客户端（比如用 Tauri 做的）：只有以下 `Origin` 来源能读到回答：
  - `tauri://localhost`
  - `http://tauri.localhost`、`https://tauri.localhost`
  - `null`（本地文件页面 `file://`）
  - `http://localhost`、`http://127.0.0.1`（本地开发时）
  - 普通网站网页无法跨域调用。
- **从程序后端或脚本直接发请求**（Rust、Node.js、Python、C# 等）：不受浏览器跨域限制。

完整的字段定义和类型约束见 [`openapi.yaml`](openapi.yaml) 或 [在线交互式 API 文档](https://docs.vrcc.cc/)。

---

## 开放数据：地图榜

数据和 [vrcc.cc/maps/](https://vrcc.cc/maps/) 一样：通过审核的地图、平均分、几人评分、名次。不给谁打了分，也不给短评。服务器边缘缓存最多 5 分钟更新一次。

### 排行：`GET /api/v1/boards/maps?limit=20`

返回**满 5 人评分**的地图，按总榜名次排，`limit` 取值 `1–100`（默认 `20`）。

```json
{
  "board": "maps",
  "min": 5,
  "at": 1792830000000,
  "maps": [
    {
      "world": "wrld_…",
      "name": "地图名",
      "author": "作者",
      "avg": 9.1,
      "raters": 9,
      "rank": 1,
      "weight": "light",
      "page": "https://vrcc.cc/maps/wrld_…",
      "img": "https://vrcc.cc/maps/wrld_….jpg"
    }
  ]
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `board` | `string` | 固定为 `"maps"` |
| `min` | `integer` | 上总榜最少需要几人评分（当前为 `5`） |
| `at` | `integer` | 这份榜单快照生成的时间（毫秒时间戳） |
| `maps[].world` | `string` | VRChat 世界 ID（`wrld_…`） |
| `maps[].name` | `string` | 地图名 |
| `maps[].author` | `string \| null` | 地图作者 |
| `maps[].avg` | `number \| null` | 1–10 分的平均分（保留一位小数） |
| `maps[].raters` | `integer` | 几人评分 |
| `maps[].rank` | `integer \| null` | 总榜名次（不满 5 人评分时为 `null`） |
| `maps[].weight` | `string \| null` | 多小咕实测的轻重：`light` 轻量、`mid` 中等、`heavy` 较重，没测过是 `null` |
| `maps[].page` | `string` | 地图在星遇同频地图榜上的详情页网址 |
| `maps[].img` | `string \| null` | 封面图网址 |

### 查几张地图：`GET /api/v1/maps?ids=wrld_…,wrld_…`

- `ids`：逗号分隔的地图 ID，**一次最多 20 张**（超过 20 张或格式不对返回 `400 bad_request`）。
- 回答 `{"maps": […], "at": 1792830000000}`，只包含在榜上的地图，单张地图字段同上。

### 查一张地图：`GET /api/v1/maps/{world}`

- 回答 `{"map": {…}, "at": 1792830000000}`，字段同上。
- 如果地图不在榜上或未通过审核，返回 `404`（`{"error": "not_found"}`）。

---

## 玩家自己的接口

以下接口（除 `/connect` 外）都必须在请求头里带 `Authorization: Bearer <令牌>` 和 `X-Client: <标识>`。

### 连接：`POST /api/v1/connect`

玩家在星遇同频网页「我的资料 → 在 VRCX 里提醒」拿到连接码（8 位，10 分钟内有效，只能用一次），发给此接口换取**令牌**（48 位十六进制）。

**请求正文：**

```json
{ "code": "ABCD2345" }
```

> 连接码里的空格、横线会被自动忽略，不分大小写。

**成功回答（`200`）：**

```json
{
  "token": "a1b2c3d4e5f60123456789abcdef0123456789abcdef0123",
  "me": {
    "star": 128,
    "vrc": "玩家的 VRChat 名字"
  }
}
```

- `token`：48 位十六进制令牌，之后的所有个人接口都在 `Authorization: Bearer <token>` 请求头里带它。
- `me.star`：玩家在 `/light/` 的点亮编号，没有时是 `null`。
- **错误状态**：
  - `404 code`：连接码不对、已过期或已经用过
  - `429 too_many`：这个网络今天尝试连接次数太多（每天最多 30 次）
  - `429 busy`：今天全站输错的连接码太多，连接功能暂停到明天

---

### 断开：`POST /api/v1/disconnect`

**成功回答（`200`）：**

```json
{ "ok": true }
```

令牌立刻失效，待收的提醒也会一并清掉。

---

### 提醒：`GET /api/v1/me/notifications?since={last}`

只在 **VRChat 开着时**每分钟问一次：
- **第一次不带 `since`**：只告诉你现在到哪了（`last`），`items` 为空数组，不给旧提醒；
- **之后每次带上一次回答里的 `last`**：返回 `since` 之后的新提醒。

**成功回答（`200`）：**

```json
{
  "last": 1042,
  "items": [
    {
      "id": 1042,
      "title": "星遇同频",
      "body": "有人连向了你",
      "at": 1792830000000
    }
  ],
  "every": 60,
  "dot": 2
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `last` | `integer` | 当前最新提醒 ID，下一次轮询作为 `?since=` 传回 |
| `items` | `array` | `since` 之后的新提醒，最多 5 条，**旧的在前**；只保留最近一天 |
| `every` | `integer` | 建议多少秒问一次（通常为 `60`）；**离上一次不到 25 秒会返回 `429 too_soon`** |
| `dot` | `integer` | 「星轨相交」里还没看过的新人数，可以在界面上当未读红点 |

---

### 最近的提醒：`GET /api/v1/me/notifications/recent[?mark=1]`

获取最近一天的最后 5 条提醒，**新的在前**。带 `?mark=1` 表示玩家现在打开看过了（会记在账号上，跨设备同步）。

**成功回答（`200`）：**

```json
{
  "items": [
    {
      "id": 1042,
      "title": "星遇同频",
      "body": "有人连向了你",
      "url": "/match/?tab=inbox",
      "at": 1792830000000
    }
  ],
  "read": 1040
}
```

- `url`：点击提醒对应的 `https://vrcc.cc` 下的页面路径（可能是 `null`）。
- `read`：玩家最后看过的那条提醒的 `id`（`id > read` 即为未读）。

---

### 星轨相交：`GET /api/v1/me/crossings[?mark=1]`

和网页「连向我 → 星轨相交」一样的列表。带 `?mark=1` 表示玩家看过了，未读红点消掉。

**成功回答（`200`）：**

```json
{
  "stars": [
    {
      "n": 77,
      "name": "拾光旅人",
      "line": "放慢脚步逛世界……",
      "group": "G",
      "star": 31,
      "intro": "介绍的前 60 个字",
      "vrc": null,
      "linked": true,
      "mutual": false,
      "at": 1792830000000,
      "fresh": true
    }
  ],
  "n": 1,
  "why": null,
  "me": {
    "star": 128,
    "vrc": "玩家的 VRChat 名字"
  }
}
```

| 字段 | 说明 |
| --- | --- |
| `stars[].n` | 星的编号；在浏览器里打开这颗星用 `https://vrcc.cc/match/?tab=inbox&cross={n}` |
| `stars[].star` | `/light/` 点亮编号（对方没公开时是 `null`） |
| `stars[].name` / `line` | 星位名和一句描述 |
| `stars[].group` | 所属星群：`G` 漫游、`W` 游戏、`Z` 创作、`L` 聊天、`A` 万象 |
| `stars[].vrc` | **只有互相连上（`mutual: true`）时才给对方的 VRChat 名字**，否则为 `null` |
| `stars[].linked` / `mutual` | 我是否已连向 TA / 双方是否已互相连上 |
| `stars[].fresh` | 是否为还没看过的新相交记录 |
| `why` | 为何不可用或为空：<br>• `null`：正常<br>• `hide`：不给这位玩家看（**此时客户端不要显示这一整块**）<br>• `verify`：还没验证 VRChat 账号<br>• `wait`：VRChat 账号验证中<br>• `queued` / `sent`：机器人的好友请求排队中 / 已发出，等玩家在 VRChat 里同意<br>• `gone` / `friend`：玩家删了或关了机器人好友 |

---

### 互相连上：`GET /api/v1/me/mutuals`

返回和当前玩家已经双向连上的星列表（最近连上的在前）。

**成功回答（`200`）：**

```json
{
  "stars": [
    {
      "n": 77,
      "name": "拾光旅人",
      "group": "G",
      "star": 31,
      "vrc": "对方的 VRChat 名字",
      "vrcUser": "usr_…",
      "at": 1792830000000
    }
  ],
  "n": 1
}
```

- `vrcUser`：对方的 VRChat 用户 ID（`usr_…`），**只在对方验证过 VRChat、并且公开了「已验证」标志时才有**，否则为 `null`。
- **加好友规范**：如果客户端提供加好友入口，请打开客户端自己的玩家页面（例如 VRCX 的玩家详情弹窗）让玩家自己点添加，**不要替玩家向 VRChat 发好友请求**。

---

### 所在的地图：`GET /api/v1/me/maps/{world}`

查询玩家当前所在地图在地图榜上的情况。`world` 是地图的 ID（**只要 `wrld_…`，不要房间实例号**）。

**成功回答（`200`）：**

```json
{
  "world": "wrld_…",
  "name": "地图名",
  "board": true,
  "pending": false,
  "off": false,
  "avg": 8.6,
  "raters": 12,
  "mine": 9,
  "can": true,
  "need": null,
  "words": "我写的短评",
  "wordsOk": "ok",
  "img": "/api/match?xdimg=wrld_…"
}
```

| 字段 | 说明 |
| --- | --- |
| `board` / `pending` / `off` | `board: true` 在地图榜上；`pending: true` 加上了但还在审核；`off: true` 不给这位玩家看（**这时不要显示**）。三个都是 `false` 说明地图榜上还没有，玩家打分时会由他添加 |
| `mine` | 玩家自己打过的分（1–10，没打过为 `null`） |
| `words` / `wordsOk` | 玩家自己的短评和审核状态（`wait` 审核中、`ok` 通过、`hidden` 没通过） |
| `can` / `need` | `can` 为现在能不能打分；不能时 `need` 说明缺什么：`verify` 先验证 VRChat 账号，`friend` 先同意机器人的好友请求，`go` 要先在这张地图上待一会儿 |
| `img` | 封面图路径，接在 `https://vrcc.cc` 后面使用 |

---

### 打分：`POST /api/v1/me/maps/{world}/rating`

给玩家当前所在的地图打分（**只能在玩家自己主动点击时发送**）。

**请求正文：**

```json
{
  "score": 9,
  "text": "一句短评（可以不带）"
}
```

- `score`：`1–10` 的整数。
- `text`：最多 30 字，和网页一样要经过检查；**带空字符串 `""` 表示删掉已有短评，不带 `text` 字段就只改分**。
- **成功回答（`200`）**：和「[所在的地图](#所在的地图get-apiv1memapsworld)」一模一样。

**打分特有错误码：**

| HTTP 状态 | `error` | 意思 |
| :---: | --- | --- |
| `403` | `map_not_went` | 还不能打分，响应里的 `need` 字段说明缺什么（`verify` / `friend` / `go`） |
| `403` | `map_elsewhere` | 机器人看到玩家现在在别的地图 |
| `403` | `map_off` / `xd_world_no` | 这张地图不给打分 / 不给这位玩家看 |
| `400` | `yq_words` | 短评没通过检查，响应里的 `why` 字段说明原因 |
| `400` | `yq_empty` | 短评只有标点符号或空白 |
| `429` | `too_many` | 今天打分或添加新地图的次数用完了 |

---

## 频率限制

| 范围 / 接口 | 限制 |
| --- | --- |
| **每个网络地址（总计）** | 每分钟 120 次左右 |
| **轮询提醒（`/me/notifications`）** | 两次之间**至少 25 秒**，建议按返回的 `every`（60 秒）；只在 VRChat 开着时问 |
| **最近的提醒、星轨相交、互相连上、所在的地图** | 四个接口加起来每颗星每天 **300 次** |
| **连接（`/connect`）** | 每个网络地址每天 **30 次** |
| **打分（`/me/maps/{world}/rating`）** | 和网页地图榜共用每天的打分与添图次数 |
| **开放数据（地图榜）** | 服务器最多 **5 分钟**更新一次，问得再勤也是同一份 |

---

## 示例

[`examples/client.mjs`](examples/client.mjs) 是一个最小的 Node.js 客户端（Node 18 以上，零外部依赖）：

```bash
node examples/client.mjs top                      # 地图榜前 10（开放数据，不用连接）
node examples/client.mjs pair ABCD2345            # 用连接码连上，令牌存到 examples/.token
node examples/client.mjs poll                     # 每分钟拉一次提醒（Ctrl+C 停）
node examples/client.mjs crossings                # 查看星轨相交
node examples/client.mjs mutuals                  # 查看互相连上的星
node examples/client.mjs recent                   # 查看最近的提醒
node examples/client.mjs map wrld_…               # 查看当前所在地图
node examples/client.mjs rate wrld_… 9 "很棒的图"  # 给地图打分和写短评
node examples/client.mjs off                      # 断开连接并清除本地令牌
```

---

## 授权

文档和示例代码用 [MIT](LICENSE)。开放数据（地图榜）可以自由使用，用的时候注明「**数据来自星遇同频地图榜（vrcc.cc）**」。地图名、作者和封面来自 VRChat，归各自的作者。「星遇同频」「VRChat 中文社区」的名字和图标不在授权里，不能用来装成官方。

## 旧的接口

我们的 VRCX 脚本（v4 及以前）用的是 `https://vrcc.cc/api/match?vrcx=…` 那一套，令牌放在网址里。它还能用，但只给我们自己的脚本；新的客户端请一律使用 `/api/v1/`。
