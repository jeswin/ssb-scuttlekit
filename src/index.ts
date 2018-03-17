import * as qs from "querystring";
import * as http from "http";
import initSocketIO = require("socket.io");

type ScuttleBot = any;
type SSBConfig = any;

function init(ssb: ScuttleBot, config: SSBConfig) {
  const port = config.scuttlekitPort || 1103;
  const server = http.createServer((req, res) => {});
  const io = initSocketIO(server);
  server.listen(port, (err: any) => {
    if (err) {
      return console.log("Scuttlekit could not be started.", err);
    }
    console.log(`Scuttlekit is listening on ${port}`);
  });
}

export = {
  name: "scuttlekit",
  version: "0.0.1",
  manifest: {},
  init
};
