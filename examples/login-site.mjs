// 「用星遇同频登录」的最小网站示例（Node 18 以上，没有依赖）：授权码 + PKCE + state。
//
//   1. 在「我的资料 → 第三方客户端 → 开发者 → 我登记的网站」登记，回调地址填 http://localhost:3000/callback
//   2. CLIENT_ID=app_… CLIENT_SECRET=sec_… SCOPE="profile vrchat card" node examples/login-site.mjs
//      （SCOPE 只写用得到的；不写只有 profile：编号和星号）
//   3. 打开 http://localhost:3000
//
// CLIENT_SECRET 只放在服务器上；只有前端的网站不用密钥，只用 PKCE（README「使用要求」）。

import { createServer } from 'node:http';
import { randomBytes, createHash } from 'node:crypto';

const { CLIENT_ID, CLIENT_SECRET, SCOPE = 'profile vrchat' } = process.env;
const PORT = 3000, REDIRECT = `http://localhost:${PORT}/callback`;
const pending = new Map();   // state → code_verifier（真实网站放在玩家的会话里）
const users = new Map();     // sub → 玩家（真实网站放进数据库）

const b64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const page = (res, html, status = 200) => { res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(`<meta charset="utf-8">${html}`); };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/') return page(res, '<a href="/login">用星遇同频登录</a>');

  if (url.pathname === '/login') {
    const state = b64url(randomBytes(16)), verifier = b64url(randomBytes(32));
    pending.set(state, verifier);
    setTimeout(() => pending.delete(state), 10 * 60e3);
    const to = new URL('https://vrcc.cc/oauth/authorize');
    to.search = new URLSearchParams({
      response_type: 'code', client_id: CLIENT_ID, redirect_uri: REDIRECT, state, scope: SCOPE,
      code_challenge: b64url(createHash('sha256').update(verifier).digest()), code_challenge_method: 'S256'
    });
    res.writeHead(302, { Location: to.href });
    return res.end();
  }

  if (url.pathname === '/callback') {
    const state = url.searchParams.get('state'), verifier = pending.get(state);
    if (!verifier) return page(res, 'state 不对，请重新登录', 400);   // 每次都核对 state
    pending.delete(state);
    if (url.searchParams.get('error')) return page(res, '你取消了登录。<a href="/">返回</a>');
    const r = await fetch('https://vrcc.cc/api/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code', code: url.searchParams.get('code') || '', redirect_uri: REDIRECT,
        client_id: CLIENT_ID, ...(CLIENT_SECRET ? { client_secret: CLIENT_SECRET } : {}), code_verifier: verifier
      })
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return page(res, '登录失败：' + esc(d.error || r.status), 400);
    users.set(d.user.sub, d.user);   // 用 sub 认人，不用星号或 VRChat 名字
    let card = '';
    if (d.scope.split(' ').includes('card')) {   // 要了别的权限：带令牌和自己的 client_id 调 me/…
      const c = await fetch('https://vrcc.cc/api/v1/me/card', { headers: { 'X-Client': CLIENT_ID, Authorization: 'Bearer ' + d.access_token } }).then((x) => x.json()).catch(() => ({}));
      if (c.name) card = `，星卡：${esc(c.name)}（${esc(c.groupName)}）`;
    }
    return page(res, `登录成功。星号 ${esc(d.user.star ?? '无')}，VRChat：${esc(d.user.vrc ? d.user.vrc.name : '没给')}${card}`);
  }

  page(res, 'not found', 404);
}).listen(PORT, () => {
  if (!CLIENT_ID) console.log('先设置 CLIENT_ID（和 CLIENT_SECRET）');
  console.log(`打开 http://localhost:${PORT}`);
});
