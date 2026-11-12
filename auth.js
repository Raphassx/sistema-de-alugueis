const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const directory = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(directory, { recursive: true });
const file = path.join(directory, 'accounts.json');
const sessions = new Map();
const attempts = new Map();
const digest = (password, salt) => crypto.scryptSync(password, salt, 64);
const salt = crypto.randomBytes(16).toString('hex');
const adminHash = process.env.ADMIN_PASSWORD ? digest(process.env.ADMIN_PASSWORD, salt) : null;
const accounts = () => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
function reply(res, status, value, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(value));
}
async function read(req) {
  let value = '';
  for await (const chunk of req) {
    value += chunk;
    if (Buffer.byteLength(value) > 1024 * 1024) throw Error('Limite excedido');
  }
  return JSON.parse(value);
}
async function authorize(req, res) {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const token = /(?:^|;\s*)rr_session=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1];
  const session = sessions.get(token);
  const user = session?.expires > Date.now() ? session.user : null;
  if (session && !user) sessions.delete(token);
  req.user = user;
  if (pathname === '/health') { reply(res, 200, { ok: true }); return true; }
  if (req.method === 'POST' && pathname.startsWith('/api/')) {
    if (req.headers.origin && req.headers.origin !== `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`) { reply(res, 403, { error: 'Origem inválida.' }); return true; }
    if (!req.headers['content-type']?.startsWith('application/json')) { reply(res, 415, { error: 'Use JSON.' }); return true; }
  }
  if (pathname === '/api/login' && req.method === 'POST') {
    if (!adminHash) { reply(res, 503, { error: 'Configure ADMIN_USER e ADMIN_PASSWORD na hospedagem.' }); return true; }
    const ip = req.socket.remoteAddress;
    const attempt = attempts.get(ip);
    if (attempt?.until > Date.now() && attempt.count >= 10) { reply(res, 429, { error: 'Aguarde 15 minutos para tentar novamente.' }); return true; }
    const input = await read(req);
    const email = String(input.email || '').trim().toLowerCase();
    const password = String(input.password || '');
    let account;
    if (input.type === 'admin' && email === (process.env.ADMIN_USER || 'admin').toLowerCase() && crypto.timingSafeEqual(digest(password, salt), adminHash)) account = { type: 'admin', email, name: process.env.ADMIN_NAME || 'Administrador' };
    if (input.type === 'employee') {
      const employee = accounts().find(item => item.email === email && item.active);
      if (employee && crypto.timingSafeEqual(digest(password, employee.salt), Buffer.from(employee.hash, 'hex'))) account = { type: 'employee', id: employee.id, email, name: employee.name };
    }
    if (!account) {
      attempts.set(ip, { count: attempt?.until > Date.now() ? attempt.count + 1 : 1, until: Date.now() + 900000 });
      reply(res, 401, { error: 'Usuário ou senha incorretos para este tipo de acesso.' }); return true;
    }
    attempts.delete(ip);
    const newToken = crypto.randomBytes(32).toString('hex');
    sessions.set(newToken, { user: account, expires: Date.now() + 28800000 });
    reply(res, 200, account, { 'Set-Cookie': `rr_session=${newToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}` });
    return true;
  }
  if (pathname === '/api/logout' && req.method === 'POST') {
    sessions.delete(token);
    reply(res, 200, { ok: true }, { 'Set-Cookie': 'rr_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' }); return true;
  }
  if (pathname === '/api/session') { reply(res, user ? 200 : 401, user || { error: 'Entre novamente.' }); return true; }
  if (pathname === '/api/employees' && req.method === 'POST') {
    if (user?.type !== 'admin') { reply(res, 403, { error: 'Acesso administrativo necessário.' }); return true; }
    const input = await read(req);
    if (!input.id || !input.name || !input.email) { reply(res, 400, { error: 'Dados incompletos.' }); return true; }
    const list = accounts();
    const previous = list.find(item => item.id === input.id);
    if ((!previous && !input.password) || (input.password && String(input.password).length < 8)) { reply(res, 400, { error: 'Informe uma senha com ao menos 8 caracteres.' }); return true; }
    const email = String(input.email).trim().toLowerCase();
    if (list.some(item => item.email === email && item.id !== input.id)) { reply(res, 409, { error: 'E-mail já cadastrado.' }); return true; }
    const newSalt = crypto.randomBytes(16).toString('hex');
    const record = { id: input.id, name: input.name, email, active: input.active !== false, salt: input.password ? newSalt : previous.salt, hash: input.password ? digest(String(input.password), newSalt).toString('hex') : previous.hash };
    fs.writeFileSync(file, JSON.stringify([...list.filter(item => item.id !== input.id), record]), { mode: 0o600 });
    for (const [key, value] of sessions) {
      if (value.user.id === input.id) sessions.delete(key);
    }
    reply(res, 200, { ok: true }); return true;
  }
  if (pathname === '/api/notifications' && req.method === 'POST' && user?.type !== 'admin') { reply(res, 403, { error: 'Acesso administrativo necessário.' }); return true; }
  return false;
}
module.exports = { authorize, reply };
