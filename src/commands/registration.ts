import { RegistrationParams } from "../types";

export async function isRegistered(): Promise<boolean> {
  return true;
}

export async function register(
  registration: RegistrationParams
): Promise<void> {
  return;
}

export async function deregister(
  appId: string,
  token: string
): Promise<boolean> {
  return true;
}
