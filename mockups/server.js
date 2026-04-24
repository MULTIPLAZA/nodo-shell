/* Servidor estático minimal para los mockups de ERP Lite Web.
   Correr con:  node server.js
   Abre:        http://localhost:8000
*/
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8000;
const ROOT = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif":  "image/gif",
  ".ico":  "image/x-icon",
  ".woff2":"font/woff2",
  ".woff": "font/woff",
};

http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    let filePath = path.join(ROOT, urlPath === "/" ? "/index.html" : urlPath);
    // Evitar escape del ROOT
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403); return res.end("403 Forbidden");
    }
    // Si es directorio, intentar index.html adentro
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        return res.end(`<h1>404 — no encontrado</h1><p>${urlPath}</p>`);
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      res.end(data);
    });
  } catch (e) {
    res.writeHead(500); res.end("500");
  }
}).listen(PORT, () => {
  console.log(`ERP Lite Web — sirviendo ${ROOT}`);
  console.log(`→ http://localhost:${PORT}`);
  console.log(`Ctrl+C para detener.`);
});
