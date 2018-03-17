import * as qs from "querystring";
import * as http from "http";
import * as url from "url";
import WebSocket = require("ws");

type ScuttleBot = any;
type SSBConfig = any;

function init(ssb: ScuttleBot, config: SSBConfig) {
  const port = config.scuttlekitPort || 1103;

  const server = http.createServer((req, res) => {});

  const wss = new WebSocket.Server({ server });

  wss.on("connection", function connection(ws, req) {
    console.log(req);
    const location = url.parse(req.url || "", true);
    debugger;
    // You might use location.query.access_token to authenticate or share sessions
    // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
    ws.on("message", function incoming(message) {
      console.log(typeof message);
      console.log("received: %s", JSON.stringify(message));
    });

    ws.send("something");
  });

  server.listen(port, function listening() {
    console.log("Listening on %d", server.address().port);
  });
}

export = {
  name: "scuttlekit",
  version: "0.0.1",
  manifest: {},
  init
};
