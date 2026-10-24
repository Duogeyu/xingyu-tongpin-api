// 星遇同频客户端接口的最小示例（Node 18 以上，没有依赖）。
//
//   node examples/client.mjs pair ABCD2345        用连接码连上，令牌存到本目录的 .token
//   node examples/client.mjs poll                 每分钟拉一次提醒（Ctrl+C 停）
//   node examples/client.mjs cross | mutual | recent
//   node examples/client.mjs map wrld_…           看一张地图
//   node examples/client.mjs rate wrld_… 9 [短评]  打分（只在玩家自己要打的时候）
//   node examples/client.mjs off                  断开
//
// CLIENT 改成你登记的标识；没登记前用 dev- 开头的。令牌只存在本机、只发给 vrcc.cc（README「使用要求」）。

import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const API = 'https://vrcc.cc/api/match';
const V = 4;
const CLIENT = 'dev-example';
const TOKEN_FILE = join(dirname(fileURLToPath(import.meta.url)), '.token');

const token = () => { try { return readFileSync(TOKEN_FILE, 'utf8').trim(); } catch { return null; } };

async function ask(query, body) {
  const r = await fetch(API + '?' + query, body
    ? { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ client: CLIENT, ...body }) }
    : { method: 'GET' });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(d.error || 'http ' + r.status); e.status = r.status; e.data = d; throw e; }
  return d;
}
const view = (name, extra = '') => ask(`vrcx=${token()}&v=${V}&client=${CLIENT}&view=${name}${extra}`);

async function poll() {
  let since = null, wait = 60;
  for (;;) {
    try {
      const d = await ask(`vrcx=${token()}&v=${V}&client=${CLIENT}` + (since === null ? '' : `&since=${since}`));
      if (d.old) { console.log('协议版本太旧'); return; }
      for (const x of d.items || []) console.log(new Date(x.at).toLocaleString(), x.title, x.body);
      since = d.last;
      wait = d.every || 60;
      if (d.dot) console.log(`星轨相交有 ${d.dot} 个新的`);
    } catch (err) {
      if (err.message === 'gone') { console.log('连接已失效，请重新连接'); return; }
      wait = err.status === 429 ? Math.max(60, err.data.every || 60) : 300;   // 429 或网络问题：退后再试
    }
    await new Promise((ok) => setTimeout(ok, wait * 1000));
  }
}

const [cmd, a, b, c] = process.argv.slice(2);
try {
  if (cmd === 'pair') {
    const d = await ask('vrcx-pair', { code: a });
    writeFileSync(TOKEN_FILE, d.token);
    console.log('已连上', d.me);
  } else if (!token()) {
    console.log('先运行 pair 连接');
  } else if (cmd === 'poll') await poll();
  else if (cmd === 'cross') console.log(JSON.stringify(await view('cross'), null, 2));
  else if (cmd === 'mutual') console.log(JSON.stringify(await view('mutual'), null, 2));
  else if (cmd === 'recent') console.log(JSON.stringify(await view('recent'), null, 2));
  else if (cmd === 'map') console.log(JSON.stringify(await view('map', '&world=' + encodeURIComponent(a)), null, 2));
  else if (cmd === 'rate') console.log(JSON.stringify(await ask('vrcx-map', { token: token(), world: a, score: Number(b), ...(c === undefined ? {} : { text: c }) }), null, 2));
  else if (cmd === 'off') { await ask('vrcx-off', { token: token() }); rmSync(TOKEN_FILE, { force: true }); console.log('已断开'); }
  else console.log('用法见文件开头');
} catch (err) {
  console.log('出错：', err.message, err.data || '');
  process.exitCode = 1;
}
