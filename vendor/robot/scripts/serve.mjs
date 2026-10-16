import http from 'http'; import fs from 'fs'; import path from 'path';
const T = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png' };
const port = +process.env.PORT || 8765;
http.createServer((q, r) => { const f = path.join('dist', decodeURIComponent(q.url.split('?')[0]).replace(/\.\./g, '') || '/'); const p = f.endsWith('/') || f === 'dist' ? path.join(f, 'index.html') : f;
  fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': T[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); })
  .listen(port, process.env.HOST || '127.0.0.1', () => console.log('http://localhost:' + port));
