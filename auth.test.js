const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
test('login, permissões, funcionários e encerramento da sessão', async () => {
  process.env.ADMIN_USER = 'admin-test';
  process.env.ADMIN_PASSWORD = 'a-long-test-password';
  process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'rental-auth-'));
  const server = require('./server');
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (url, data, cookie = '') => fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(data) });
  try {
    assert.equal((await fetch(base + '/server.js')).status, 404);
    assert.equal((await fetch(base + '/.git/config')).status, 404);
    assert.equal((await post('/api/notifications', [])).status, 403);
    assert.equal((await post('/api/login', { type: 'admin', email: 'admin-test', password: 'wrong' })).status, 401);
    const login = await post('/api/login', { type: 'admin', email: 'admin-test', password: process.env.ADMIN_PASSWORD });
    assert.equal(login.status, 200);
    assert.match(login.headers.get('set-cookie'), /HttpOnly/);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const employee = { id: 'one', name: 'Pessoa', email: 'employee@example.com', password: 'employee-password', active: true };
    assert.equal((await post('/api/employees', employee)).status, 403);
    assert.equal((await post('/api/employees', employee, cookie)).status, 200);
    assert.ok(!fs.readFileSync(path.join(process.env.DATA_DIR, 'accounts.json'), 'utf8').includes(employee.password));
    const employeeLogin = await post('/api/login', { type: 'employee', email: employee.email, password: employee.password });
    assert.equal(employeeLogin.status, 200);
    const employeeCookie = employeeLogin.headers.get('set-cookie').split(';')[0];
    assert.equal((await post('/api/notifications', [], employeeCookie)).status, 403);
    assert.equal((await post('/api/employees', { ...employee, active: false }, cookie)).status, 200);
    assert.equal((await post('/api/login', { type: 'employee', email: employee.email, password: employee.password })).status, 401);
    await post('/api/logout', {}, cookie);
    assert.equal((await fetch(base + '/api/session', { headers: { Cookie: cookie } })).status, 401);
  } finally {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
  }
});
