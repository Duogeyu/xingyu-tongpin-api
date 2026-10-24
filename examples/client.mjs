// 星遇同频开放接口的最小示例（Node 18 以上，没有依赖）。
//
//   node examples/client.mjs top                  地图榜前 10（开放数据，不用连接）
//   node examples/client.mjs login ["card maps"]  设备授权：显示码、打开同意页，玩家同意后令牌存到本目录的 .token
//                                                 （可以只要列出的权限；不写就是客户端默认的那一串）
//   node examples/client.mjs pair ABCD2345        旧方式：用连接码连上
//   node examples/client.mjs poll                 每分钟拉一次提醒（Ctrl+C 停）
//   node examples/client.mjs crossings | mutuals | recent | card | mymaps
//   node examples/client.mjs map wrld_…           玩家所在的地图
//   node examples/client.mjs rate wrld_… 9 [短评]  打分（只在玩家自己要打的时候）
//   node examples/client.mjs off                  断开
//
// CLIENT 改成你登记的标识；没登记前用 dev- 开头的。令牌只存在本机、只发给 vrcc.cc（README「使用要求」）。

import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';

const API = 'https://vrcc.cc/api/v1/';
const CLIENT = 'dev-example';
const TOKEN_FILE = join(dirname(fileURLToPath(import.meta.url)), '.token');

const token = () => { try { return readFileSync(TOKEN_FILE, 'utf8').trim(); } catch { return null; } };

async function ask(path, { body, auth = false } = {}) {
  const headers = { 'X-Client': CLIENT };
  if (auth) headers.Authorization = 'Bearer ' + token();
  if (body) headers['Content-Type'] = 'application/json';
  const r = await fetch(API + path, { method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(d.error || 'http ' + r.status); e.status = r.status; e.data = d; throw e; }
  return d;
}
const show = (d) => console.log(JSON.stringify(d, null, 2));

// 设备授权：拿码 → 给玩家看、打开链接 → 每 interval 秒问一次 → 拿到令牌存本机
async function login(scope) {
  const c = await ask('device/code', { body: scope ? { scope } : {} });
  console.log('要的权限：', c.scope);
  console.log(`在浏览器里打开 ${c.verification_uri_complete}
或在「我的资料 → 第三方客户端」输入 ${c.user_code}`);
  const open = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', c.verification_uri_complete]]
    : [process.platform === 'darwin' ? 'open' : 'xdg-open', [c.verification_uri_complete]];
  try { spawn(open[0], open[1], { stdio: 'ignore', detached: true }).on('error', () => {}).unref(); } catch {}
  const end = Date.now() + c.expires_in * 1000;
  while (Date.now() < end) {
    await new Promise((ok) => setTimeout(ok, c.interval * 1000));
    try {
      const d = await ask('device/token', { body: { device_code: c.device_code } });
      writeFileSync(TOKEN_FILE, d.access_token);
      console.log('已连上', d.me, '权限：', d.scope);
      return;
    } catch (err) {
      if (err.message === 'authorization_pending') continue;
      if (err.message === 'access_denied') { console.log('玩家没有同意'); return; }
      if (err.message === 'expired_token') break;
      throw err;
    }
  }
  console.log('码过期了，请重新运行 login');
}

async function poll() {
  let since = null, wait = 60;
  for (;;) {
    try {
      const d = await ask('me/notifications' + (since === null ? '' : '?since=' + since), { auth: true });
      for (const x of d.items) console.log(new Date(x.at).toLocaleString(), x.title, x.body);
      since = d.last;
      wait = d.every || 60;
      if (d.dot) console.log(`星轨相交有 ${d.dot} 个新的`);
    } catch (err) {
      if (err.message === 'gone') { console.log('连接已失效，请重新运行 login'); return; }
      wait = err.status === 429 ? Math.max(60, (err.data && err.data.every) || 60) : 300;   // 429 或网络问题：退后再试
    }
    await new Promise((ok) => setTimeout(ok, wait * 1000));
  }
}

const [cmd, a, b, c] = process.argv.slice(2);
try {
  if (cmd === 'top') {
    for (const m of (await ask('boards/maps?limit=10')).maps) console.log(`${m.rank}. ${m.name}  ${m.avg} 分（${m.raters} 人）  ${m.page}`);
  } else if (cmd === 'login') {
    await login(a);
  } else if (cmd === 'pair') {
    const d = await ask('connect', { body: { code: a } });
    writeFileSync(TOKEN_FILE, d.token);
    console.log('已连上', d.me);
  } else if (!token()) {
    console.log('先运行 login 连接');
  } else if (cmd === 'poll') await poll();
  else if (cmd === 'crossings') show(await ask('me/crossings', { auth: true }));
  else if (cmd === 'mutuals') show(await ask('me/mutuals', { auth: true }));
  else if (cmd === 'recent') show(await ask('me/notifications/recent', { auth: true }));
  else if (cmd === 'card') show(await ask('me/card', { auth: true }));
  else if (cmd === 'mymaps') show(await ask('me/maps', { auth: true }));
  else if (cmd === 'map') show(await ask('me/maps/' + a, { auth: true }));
  else if (cmd === 'rate') show(await ask('me/maps/' + a + '/rating', { auth: true, body: { score: Number(b), ...(c === undefined ? {} : { text: c }) } }));
  else if (cmd === 'off') { await ask('disconnect', { auth: true, body: {} }); rmSync(TOKEN_FILE, { force: true }); console.log('已断开'); }
  else console.log('用法见文件开头');
} catch (err) {
  if (err.message === 'scope') console.log(`令牌没有「${err.data.need}」权限，用 login 重新授权时把它要上`);
  else console.log('出错：', err.message, err.data || '');
  process.exitCode = 1;
}
