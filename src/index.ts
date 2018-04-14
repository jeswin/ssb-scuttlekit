import * as http from "http";
import * as qs from "querystring";
import * as url from "url";
import WebSocket = require("ws");

const packageJSON = require("../package.json");

type ScuttleBot = any;
type SSBConfig = any;

function init(ssb: ScuttleBot, config: SSBConfig) {
  const port = config.scuttlekitPort || 1103;

  const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Request-Method", "*");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET");
    res.setHeader("Access-Control-Allow-Headers", "*");
    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
    } else if (req.url === "/") {
      res.writeHead(200);
      res.write(`<p>ScuttleKit ${packageJSON.version} is installed.</p>`);
      res.end();
    } else if (req.url === "/register") {
      
    }
  });

  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws: WebSocket, req: http.ServerRequest) => {
    ws.on("message", (messageJSON: string) => {
      const { method, args } = JSON.parse(messageJSON);
      if (method === "getService") {
        const [name] = args;
        if (name === "notifications") {

        }
      }
    });
    ws.send("something");
  });

  server.listen(port, function listening() {
    console.log("ScuttleKit listening on %d", server.address().port);
  });
}

export = {
  init,
  manifest: {},
  name: "scuttlekit",
  version: "0.0.1"
};
