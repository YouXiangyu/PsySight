const http = require("http");
const path = require("path");
const next = require("next");

const port = Number(process.env.PORT || 8003);
const host = process.env.HOST || "0.0.0.0";
const appDir = path.resolve(__dirname, "..");

const app = next({
  dev: true,
  dir: appDir,
  hostname: host,
  port,
});

const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    http.createServer((req, res) => handle(req, res)).listen(port, host, () => {
      const shownHost = host === "0.0.0.0" ? "127.0.0.1" : host;
      console.log(`> Dev server ready on http://${shownHost}:${port}`);
    });
  })
  .catch((err) => {
    console.error("> Failed to start single-process Next dev server");
    console.error(err);
    process.exit(1);
  });
