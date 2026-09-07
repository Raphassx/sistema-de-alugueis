const http = require('http');
const fs = require('fs');
const path = require('path');

// Aceita conexoes do app dos alunos em outros dispositivos da mesma rede.
const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT) || 3000;
const root = __dirname;
const notificationsFile = path.join(root, 'notifications.json');
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

const server = http.createServer((request, response) => {
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

  const requestedPath = decodeURIComponent(request.url.split('?')[0]);
  const relativePath = requestedPath === '/' ? 'index.html' : requestedPath.replace(/^\/+/, '');
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

server.listen(port, host, () => {
  console.log(`Academia Shape Combat disponível em http://${host}:${port}`);
});
