import * as fs from "fs";
import * as http from "http";
import * as path from "path";
import * as qs from "querystring";
import * as url from "url";
import WebSocket = require("ws");
import * as api from "./api";
import * as auth from "./auth";
import { IAppSettings, IToken } from "./types/basic";

const packageJSON = require("../package.json");

type ScuttleBot = any;
type SSBConfig = any;

function addCORSHeaders(res: http.ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Request-Method", "*");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "*");
}

async function init(ssb: ScuttleBot, config: SSBConfig) {
  if (await isFirstRun(config)) {
    await setupScuttleKit(config);
  }

  const scuttleKitState = await getScuttleKitState(config);
  await auth.init(scuttleKitState);

  const server = http.createServer(async (req, res) => {
    addCORSHeaders(res);
    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
    } else if (req.url === "/") {
      res.writeHead(200);
      res.write(`<p>ScuttleKit ${packageJSON.version} is installed.</p>`);
      res.end();
    } else if (req.url === "/register") {
    } else if (req.url === "/validate" && req.method === "POST") {
      return await api.validate(req, res);
    }
  });

  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws: WebSocket, req: http.IncomingMessage) => {
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

  const port = config.scuttlekitPort || 1103;
  server.listen(port, function listening() {
    console.log("ScuttleKit listening on %d", server.address().port);
  });
}

async function isFirstRun(config: SSBConfig) {
  const configPath = path.join(config.path, "scuttlekit");
  return !fs.existsSync(configPath);
}

async function setupScuttleKit(config: SSBConfig) {
  const configPath = path.join(config.path, "scuttlekit");
  fs.mkdirSync(configPath);

  const tokensFile = path.join(configPath, "tokens.json");
  const tokens: IToken[] = [];

  fs.writeFileSync(tokensFile, JSON.stringify(tokens));
}

async function getScuttleKitState(config: SSBConfig) {
  const configPath = path.join(config.path, "scuttlekit");
  const tokensFile = path.join(configPath, "tokens.json");
  const tokens = JSON.parse(fs.readFileSync(tokensFile).toString()) as IToken[];
  return { tokens };
}

export = {
  init,
  manifest: {},
  name: "scuttlekit",
  version: "0.0.1"
};
