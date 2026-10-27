# 更新记录

接口要变的地方先写在这里。兼容和弃用的规则见 [README → 兼容和弃用](README.md#兼容和弃用)：只做加法，要删要改的至少再留 60 天。每条后面括号里是版本号。

## 2026-10-28 · 引力标（1.15.0）

只加不改，没有新权限。

- **`gravity`**：网页上星卡和名字后面的引力标（这颗星在爱发电支持星遇同频），格式见 `Gravity`：`stage` 样子（心动、引力、双星、星团、星系）、`gray` 已结束留着的灰色标、`months`、`since`，结束了的还有 `until`。没有引力标的星没有这个字段。
  - **新加**：`GET me/card`（我的星卡）。
  - **补上文档**：星卡（今天的星、连向我、星轨相交）、私聊的对方、星友圈和地图榜里写东西的人，网页上本来就显示引力标，回答里也一直带着这个字段（2026-10-27 起），这次写进文档和字段契约。私聊的对方顺带补上 `verified`。

## 2026-10-27 · 兼容和弃用规则（1.14.0）

- **写明规则**：README 新的「兼容和弃用」一节：v1 只做加法；要删、要改的先标弃用，至少再留 60 天；怎么通知；安全问题立刻改；版本号怎么升。CHANGELOG 每条补上了版本号。
- **弃用的响应头**：带着「弃用中」那几个字段的回答，多 `Deprecation`、`Sunset`、`Link: <…>; rel="deprecation"` 三个响应头，桌面客户端的页面也读得到。现在弃用的是 `counts.regenToday`、`counts.styles`（2026-11-26 停）和 `teen`、`adj`、`vibe`、`can`、`need`（2026-12-26 停），所以 `me/card`、各处星卡、`me/inbox`、`me/board`、地图页、`me/maps/{world}` 的回答都带着。
- **申请审核要填版本**：「申请审核」多一项「版本」（必填）。审核通过的是那个版本，以后大改（多要敏感权限、改了数据用法、换了源码地址）要用新版本号重新申请。已经审核通过的应用不受影响。
- **发布前的安全审查**（1.12.0–1.14.0 这几条是审查以后的样子）：`me/settings`、`me/notes`、`me/unread` 看不出玩家在哪个星池（见下面两条）；签名图片不带 `RateLimit-*`；`crossings` 的同意页写明「会看到其他玩家的资料」；带 `seed` 的贴纸图不要公开展示。
- **补上文档**：`me/board` 的地图有 `rank`（名次）、`intro`（赞最多的那段介绍的第一行），2026-10-27 地图榜改版时加的；本周榜只按本周的打分排（`me/board?sort=week` 和 `boards/maps?sort=week` 一样）。

## 2026-10-27 · 五个新接口（1.13.0）

只加不改，没有新权限。

- **本周榜、新上榜** `GET /api/v1/boards/maps?sort=week|new`：和网页地图榜的「本周」「新上榜」一样（不分星池；本周只按本周的打分排）。本周榜每张多 `week`（本周几人打分）。不写 `sort` 照旧是总榜，回答多一个 `sort`；别的值返回 `400`。
- **公开地图页** `GET /api/v1/maps/{world}/page`：和 vrcc.cc/maps/ 上每张地图的页面一样：分数分布、去过的人数、房间上限、多小咕实测。
- **通知中心** `GET /api/v1/me/notes`（`notifications`）：网页「通知」那张表，读了不标已读。账号、星池、星搭、管理员的通知不在这里，每类只给认得的那几句话，只有一个星池才会收到的（模型截图、合照、16–17 岁看不到的地图）也不给；送礼物的通知里送礼人换成「一颗互相连上的星」。
- **未读数** `GET /api/v1/me/unread`（`notifications`）：连向我、星轨相交（令牌有 `crossings` 才有）、私聊、通知各有几条未读，每天 1500 次。
- **星轨相交的完整星卡** `GET /api/v1/me/crossings/cards[?mark=1]`（`crossings`）：网页「星轨相交」那一页的回答，带今天还能连几颗。
- 频率限制表补上 `me/bag`、`me/settings` 没有每天上限（1.12.0 漏写）。

## 2026-10-27 · 只读接口（1.12.0）

只加不改。

- **公告和停站** `GET /api/v1/announcements`：网页上给所有玩家的公告（顶上一条、弹窗、强制）和停站时的说明、预计恢复时间。要带 `client`，不用令牌，任何网页都能读，停站时也能问。只发给某个星池的公告不在这里。
- **我的贴纸和星尘** `GET /api/v1/me/bag`（新的普通权限 `bag`）：仓库里有过的贴纸（材质、还剩几张、划痕位置、图片地址）和星尘余额。
- **我的资料和隐私设置** `GET /api/v1/me/settings`（新的普通权限 `settings`）：关于我和它的审核状态、推荐里的几项、VRChat 是否验证、「谁能看到」两个星池都有的六项。不含邮箱和星池，同样的设置两个星池回答一样（模型截图、个人主页、星轨相交、寒暑假这些只有一个星池有的不给）。
- **我给 TA 的分**：`me/mutuals` 每颗星多 `rate: {played, mine}`（连上的第二天起，当天是 `null`）。`me/today`、`me/inbox` 里互相连上的卡原来就有 `rate`，这次写进文档。

## 2026-10-27 · 规范化（1.11.0）

只加不改，原来的字段和写法都还在。

- **开放数据给任何网页读**：`boards/maps`、`maps`、`maps/{world}`、`status` 回答 `Access-Control-Allow-Origin: *`，可以带 `X-Client`（预检也通过），出错时网页也能读到原因。其他接口照旧只给桌面客户端的页面，并且都带 `Vary: Origin`。
- **`HEAD`**：开放数据和 `status` 支持（和 `GET` 一样，没有正文）。玩家自己的接口每次都算次数，不支持。
- **`405`**：路径对、方法不对，回答 `405 {"error": "method"}` 和 `Allow` 头；原来是 `404 not_found`。
- **每天次数的响应头**：带每天次数的接口回答 `RateLimit-Limit`、`RateLimit-Remaining`、`RateLimit-Reset`（秒，到北京时间零点）。
- **加的字段**：`me/board`、地图页的地图有 `world`（和 `id` 同值）；`me/maps/{world}`、打分的回答、`me/board`、地图页有 `imgUrl`（封面的完整网址）；评论、点亮、合照回答里的 `post.img` 也有 `url`；`POST /connect` 多了 `access_token`、`token_type`、`scope`（`token` 还在）。
- 贴纸的错误（`400`、`404`）只缓存一分钟，原来是一天。
- 「我登记的应用」里能看到每个应用 7 天的调用次数、被限流和被拒的次数、有几位玩家连着。

## 2026-10-27 · 文档对齐（1.10.1）

只改文档，接口没变。

- 第三批的 24 个接口都有了回答的结构和示例；新的 [`examples/responses.json`](examples/responses.json) 是每个接口的完整示例回答（离线生成的假数据）。
- 改正：`me/inbox` 的 `cross` 是 `{n, fresh}`，不是数字；`me/card` 有 `verified`、`deco`；开放数据的地图有 `hot`（热评）；`me/notifications` 有 `latest`；敏感权限清单补上 `photos`、`maps.write`、`safety`；`/photo/{n}` 写进 openapi；「星友圈的图」不再说不提供玩家照片。
- 错误码表补全（`method`、`server`、`stop`、`code`、`too_soon`、`busy`，以及网页上的动作和打分自己的码）；`map_not_went`、`map_elsewhere` 从 2026-10-24 起就不再返回了。
- 新的两节：「同一个东西在不同接口里」（字段对照、没有值的时候、翻页）、「弃用中」。
- **弃用**（网页不显示的字段）：`counts.regenToday`、`counts.styles` 2026-11-26 起不再返回；`teen`、`adj`、星卡的 `vibe`，以及 `me/maps/{world}` 恒为 `true` / `null` 的 `can`、`need`，2026-12-26 起不再返回。
- 只保证文档列出的字段：「网页上的动作」回答里没列出的字段可能变化或去掉。
- 频率限制写清两份读的次数各算哪些接口，补上第三批的写操作；停站时网页上的动作回答 `503 stop`。

## 2026-10-27 · 90 天不用自动断开（1.10.0）

- 授权（第三方客户端和用星遇同频登录的网站）**90 天没有调用过任何接口就自动断开**，之后的请求回答 `404 gone`（网站的 `oauth/userinfo` 回答 `401 invalid_token`），让玩家重新授权就好。按最后一次调用算，调任何接口都算；最早的一批要到 2027 年 1 月 22 日才会碰到。
- 「第三方客户端」里的「上次使用」现在是最后一次调用任何接口的时间，原来只算轮询提醒。每位玩家满 10 个时删掉的「最久没用的」也按它算。

## 2026-10-27 · 几处行为修正（1.9.0）

- 所有 `429` 都带 `Retry-After`（秒）：每分钟的限制 60；`too_soon` 是 25 秒间隔还剩的；`quota`（这一轮连满）到下一轮；其余每天的次数到北京时间零点。桌面客户端的页面也能读到（`Access-Control-Expose-Headers`）。原来只有每分钟的限制带，文档说「等一分钟再试」，每天的次数用完时会白试一整天。
- 签名图片（`/img/…`、`/photo/…`）失效时回 `404 {"error": "expired"}`，原来是 `gone`；`gone` 只表示令牌失效。
- 表单正文里的是和否按字面算：`on=false` 是取消点亮（原来会点亮），`yes=true` 是同意合照。`true`、`1` 是，`false`、`0` 否。`?mark` 也只认这几种「是」，`?mark=0` 不再标已读。
- 自助登记的应用（`client_id` 当 `X-Client`）可以用 `POST /connect`，原来回 `403 client_unknown`；权限是 `profile notifications maps`。
- `POST /disconnect` 要用拿到令牌的那个 `X-Client`，不对回 `403 client_mismatch`。

## 2026-10-27 · 地图页里写的人（1.8.6）

- `GET me/maps/{world}/page`、`GET me/maps/{world}/intros`，以及回答整张地图页的写接口（添加地图、写介绍）：令牌没有 `mutuals`、或客户端没有通过审核（审核被撤回也算）时，短评、介绍和添加人里别的玩家只给 `{"name": "某位<星位>", "group", "me": false}`，和公开地图页一样，不再给对方的星编号 `n` 和互相连上时的 VRChat 名字。原因：`maps` 是普通权限，而互相连上的人的 VRChat 名字只该给有 `mutuals`（敏感权限）的审核过的客户端。有 `mutuals` 的照旧；自己的短评和介绍照旧。安全修正，没有提前通知期。

## 2026-10-27 · 地图榜名次的算法（1.8.5）

- 名次的算法变了（README「名次怎么算」）：每张图先算 3 份 7 分再加上玩家的评分（原来是 5 份全站平均分，约 9 分），地图作者给自己的图打分不算；同样的平均分，评分人数越多越靠前。返回格式不变，`rank` 的数值会变。
- 文档改正：`min` 早就是 `1`（有一个评分就有名次），原来写的「满 5 人评分」过时了。

## 2026-10-25 · 配额提升（1.8.4）

- 最近的提醒、星轨相交、互相连上、所在的地图、我打过分的地图：从每颗星每天 300 次（玩家所有客户端合计）改成每个授权每天 1000 次，各客户端分开算。

## 2026-10-25 · 星卡给自己的编号（1.8.3）

- `GET me/card` 多了 `n`：玩家自己的星编号。`me/stars/{n}/photo` 用自己的 `n` 总是清晰照片（不用和自己连上）。

## 2026-10-25 · 设备授权认表单（1.8.2）

- `device/code`、`device/token` 的正文可以是表单（`application/x-www-form-urlencoded`），之前只认 JSON、表单回 400 `bad_request`。
- `device/code` 的 `scope` 也可以放在查询串里（正文里有时以正文为准）。

## 2026-10-25 · 贴纸素材单独限流（1.8.1）

- 贴纸素材每个网络地址每分钟 600 次，单独计算，不占接口的 120 次；支持 `HEAD`。

## 2026-10-25 · 星卡的装扮、贴纸素材（1.8.0）

- `GET me/card` 多了 `deco`（`me/today`、`me/inbox` 的星卡本来就有），文档写清楚了它的格式。
- 贴纸素材：`GET /api/v1/stickers`（所有贴纸和材质的名字）、`GET /api/v1/stickers/{id}?fin=&wear=&seed=`（和网页同一份代码画的 SVG）。不用 `client`。卡面、卡套、卡背只给 id。

## 2026-10-25 · 是否已验证、运行状态（1.7.0）

- `oauth/userinfo`（和换令牌时的 `user`）、`GET me/card` 多了 `verified`：玩家有没有验证过 VRChat 账号。只要普通权限，不给账号本身。
- 运行状态：页面 https://vrcc.cc/status/ ，接口 `GET /api/v1/status`（不用 `client`），只说网站和接口能不能用。

## 2026-10-25 · 名字和 logo（1.6.0）

- 使用要求加「名字和 logo」（第 17–20 条）：不拿 VRCC 的 logo、星遇同频的图标和名字当自己的应用图标或名字；注明来源用文字；「用星遇同频登录」按钮只写字；审核通过才能写「已通过星遇同频审核」。

## 2026-10-25 · 第三批：举报和隐藏、评论和点亮、地图榜、照片（1.6.0）

- 新权限（都是敏感权限）：`photos`（其他玩家的照片，互相连上才清晰，清晰的给签名链接）、`maps.write`（写介绍、赞踩、添加地图）、`safety`（举报和隐藏）。
- 新接口：举报 / 隐藏 / 恢复一颗星、隐藏列表、说一句、撤回和举报私聊、评论的读写和删除、点亮、删自己的动态、同意合照、举报动态和评论、玩家看到的地图榜（`me/board`）、地图页、全部介绍、写和删介绍、删评分、赞踩、举报短评和介绍、添加地图。详见 README「第三批」。
- 显示其他玩家内容的客户端，请把举报和隐藏做上。
- `maps.rate` 的说明改成「在你操作时，为地图打分」（10-25 起没去过也能打分）。

## 2026-10-25 · 星友圈的图（1.5.0）

- `GET me/posts` 里有图的动态，`img` 多了 `url`：这张图的签名地址，10 分钟内有效，直接放进 `<img>` 就能显示，不用请求头。
- 新接口 `GET /img/{id}`（就是这个 `url`）：每次打开都再查授权、`posts` 权限、客户端没被停用、玩家现在还看得到这条动态，不满足就是 `404`；算一次读取。
- 只有星友圈动态的配图和合照，玩家星卡上的照片不提供。

## 2026-10-25 · 应用审核：敏感权限要先审核（1.4.0）

- 敏感权限（`vrchat`、`maps.rate`、`crossings`、`mutuals`、`today`、`inbox`、`link`、`chat`、`chat.send`、`posts`、`posts.write`）只给开 Issue 登记的客户端和审核通过的自助登记应用。
- 没审核的应用：敏感权限只有登记人自己的账号能同意，用来开发测试；别的玩家同意会被拒（`403 scope_unreviewed`），取消照样带 `access_denied` 回去。
- `dev-` 只能要普通权限，不写就是 `profile notifications maps`（连接码也是）；要敏感的 `device/code` 回答 `403 scope_unreviewed`。
- 每次调用都再查：审核被撤回，敏感接口当场回答 `403 scope_unreviewed`，`userinfo` 的 `vrc` 变成 `null`，普通接口照常。
- 申请审核：「我的资料 → 第三方客户端 → 我登记的应用 → 申请审核」，填做什么用、源码地址（客户端必须开源）、会怎么用玩家的数据；结果发邮件和站内通知；改了已通过的应用会回到未审核。
- 示例 `login-site.mjs` 默认改成只要 `profile`。

## 2026-10-25 · 第二批：今天的星、连向我、连线、私聊、星友圈（1.3.0）

- 新权限和接口，做的事和网页一样，网页的规则和上限照样算：`today`（`GET me/today`）、`inbox`（`GET me/inbox[?mark=1]`）、`link`（`POST me/links`）、`chat`（`GET me/chats`、`GET me/chats/{n}`）、`chat.send`（`POST me/chats/{n}`）、`posts`（`GET me/posts`）、`posts.write`（`POST me/posts`，只能发文字）。
- 每个令牌每天另有上限：读 1000 次、连线 20 次、私聊 100 条、发星友圈 5 条，超了 `429 too_many`。
- 写操作（`link`、`chat.send`、`posts.write`、`maps.rate`）只在玩家自己点的时候发，不自动连线、不群发。账号操作不在接口里，以后也不会有。
- 网页上的动作里，对方不在了回答 `404 star_gone`；`404 gone` 只表示令牌失效。
- 同意页：`profile` 那一行不再写出星号数字；顶上写普通权限和敏感权限各几项，敏感的排前面、标「敏感」，超过三项的先收起，可以展开。
- 「我登记的网站」改名「我登记的应用」：一次登记可以是网站也可以是客户端；回调地址可以不填（不填只能走设备授权）。
- 自助登记的应用什么权限都能要（不写还是只有 `profile`），之前「网站不能要星轨相交和互相连上」的限制去掉了。同意页写「玩家自行登记，未经星遇同频审核」，玩家的列表里标「未审核」。

## 2026-10-25 · 按项授权（权限 scope）（1.2.0）

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

## 2026-10-25 · 设备授权、用星遇同频登录（1.1.0）

- 设备授权（推荐的连接方式）：`POST device/code` 拿码和同意链接，玩家在浏览器里看到客户端名字后点同意，客户端每 5 秒 `POST device/token` 拿令牌。
- 连接码 `POST connect` 还能用，算旧方式；新客户端请用设备授权。
- 每个客户端有自己的授权：不再顶掉玩家 VRCX 脚本里的连接。同一个客户端再授权一次，它之前的令牌失效；每位玩家最多 10 个。玩家在「我的资料 → 第三方客户端」能看到并单独断开；`disconnect` 只断开这一个。
- 提醒轮询的 25 秒间隔按每个授权算。
- 用星遇同频登录（OAuth 2.0 授权码 + PKCE）：网站在「我的资料 → 第三方客户端 → 开发者 → 我登记的网站」自己登记；跳 `https://vrcc.cc/oauth/authorize`，回来用 `POST oauth/token` 换令牌，`GET oauth/userinfo` 再查。拿到的只有 `sub`、星号和验证过的 VRChat 账号。
- 新示例 `examples/login-site.mjs`；`examples/client.mjs` 加了 `login`（设备授权）。

## 2026-10-24 · 第一版（/api/v1/）（1.0.0）

- 开放数据：地图榜排行 `boards/maps`、查地图 `maps?ids=`、`maps/{world}`，不用登录；VRChat 世界里的组件可以把 `client` 放在网址里。
- 玩家自己的：`connect`、`disconnect`、`me/notifications`、`me/notifications/recent`、`me/crossings`、`me/mutuals`、`me/maps/{world}`、`me/maps/{world}/rating`，令牌放在 `Authorization` 请求头里。
- 每个请求都要带登记过的 `client` 标识（开发时 `dev-` 开头）；没登记的回答 `client_unknown`，被停用的回答 `client_off`。
- Tauri 客户端的页面（`tauri://localhost`、`http(s)://tauri.localhost`）能读到回答。
- 玩家连上时，站内通知和「我的资料」里写明是哪个客户端。
