const http = require('http');
const fs = require('fs');
const path = require('path');
const { authorize, reply } = require('./auth');

// Aceita conexoes do app dos alunos em outros dispositivos da mesma rede.
const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT) || 3000;
const root = __dirname;
const notificationsFile = path.join(process.env.DATA_DIR || path.join(root, 'data'), 'notifications.json');
if (!fs.existsSync(notificationsFile)) fs.copyFileSync(path.join(root, 'notifications.json'), notificationsFile);
const publicFiles = new Set(['index.html', 'app.js', 'styles.css', 'notifications.css', 'logo-rr.png', 'academia1.jpg', 'notification-holiday.png']);
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    if (await authorize(request, response)) return;
  } catch {
    reply(response, 400, { error: 'Dados inválidos.' });
    return;
  }
  if (request.url === '/api/notifications' && request.method === 'GET') {
    fs.readFile(notificationsFile, 'utf8', (error, content) => {
      const notifications = error ? [] : JSON.parse(content || '[]');
      response.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      });
      response.end(JSON.stringify(notifications));
    });
    return;
  }

  if (request.url === '/api/notifications' && request.method === 'POST') {
    let body = '';
    request.on('data', chunk => { body += chunk; });
    request.on('end', () => {
      try {
        const notifications = JSON.parse(body);
        fs.writeFileSync(notificationsFile, JSON.stringify(notifications, null, 2));
        response.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
        response.end();
      } catch {
        response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
        response.end(JSON.stringify({ error: 'Dados inválidos' }));
      }
    });
    return;
  }

  if (request.url === '/api/notifications' && request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    response.end();
    return;
  }

  let requestedPath;
  try { requestedPath = decodeURIComponent(request.url.split('?')[0]); }
  catch { response.writeHead(400); response.end(); return; }
  const relativePath = requestedPath === '/' ? 'index.html' : requestedPath.replace(/^\/+/, '');
  if (!publicFiles.has(relativePath)) { response.writeHead(404); response.end(); return; }
  const filePath = path.resolve(root, relativePath);

  if (!filePath.startsWith(root + path.sep) && filePath !== path.join(root, 'index.html')) {
    response.writeHead(403);
    response.end('Acesso negado');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(error.code === 'ENOENT' ? 'Arquivo não encontrado' : 'Erro interno');
      return;
    }

    response.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    response.end(content);
  });
});

if (require.main === module) server.listen(port, host, () => {
  console.log(`Sistema de Aluguéis disponível em http://${host}:${port}`);
});
module.exports = server;
