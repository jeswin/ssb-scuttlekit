import { Context } from "koa";

const packageJSON = require("../../package.json");

export default async function(ctx: Context) {
  ctx.body = `<p>ScuttleKit ${packageJSON.version} is installed.</p>`;
}
