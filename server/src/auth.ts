import * as fs from "fs";
import * as path from "path";
import { IAppSettings, IScuttleKitState, IToken } from "./types/basic";

type ScuttleBot = any;
type SSBConfig = any;

let tokens: IToken[];

export async function init(state: IScuttleKitState) {
  tokens = state.tokens;
}

export function addToken(token: string, settings: IAppSettings) {}

export async function validate(token: string) {
  return tokens.some(t => t.token === token);
}

export async function getAppSettings(token: string) {
  return tokens.find(t => t.token === token);
}
