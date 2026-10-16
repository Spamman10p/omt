'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.txt':'text/plain'};
http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
 let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
 if(name==='/')name='/index.html';
 if(!/^\/(?:index\.html|workshop\.(?:css|js)|robot-viewer\.js|(?:assets|robot)\/[^.][\w/.-]+)$/.test(name)){res.writeHead(404);return res.end();}
 const file=path.resolve(root,'.'+name);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);});
}).listen(8080,'0.0.0.0',()=>console.log('OMT container preview ready on :8080; publish to loopback only.'));
