import * as fs from "fs";
import * as http from "http";
import koa = require("koa");
import bodyParser = require("koa-bodyparser");
import route = require("koa-route");
import serve = require("koa-static");
import * as path from "path";
import * as qs from "querystring";
import * as url from "url";
import WebSocket = require("ws");
import * as auth from "./auth";
import * as pages from "./pages";
import { IAppSettings, IToken } from "./types/basic";

const cors = require("koa-cors");
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

  const state = await getScuttleKitState(config);
  await auth.init(state);

  const app = new koa();
  app.use(cors());
  app.use(bodyParser());
  app.use(serve("./client", { prefix: "/client" } as any));
  app.use(route.get("/", pages.home));
  app.use(route.post("/register", pages.register));

  const port = config.scuttlekitPort || 1103;
  const server = app.listen(port, function listening() {
    console.log("ScuttleKit listening on %d", server.address().port);
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
