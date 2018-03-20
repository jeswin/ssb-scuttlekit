export interface AccessType {
  owner: boolean;
  read: boolean;
  write: boolean;
  encrypted: boolean;
}

export interface RegistrationParams {
  appName: string;
  appId: string;
  author: string;
  url: string;
  domain: string;
  port: string;
  messageTypes: {
    [key: string]: AccessType;
  };
}
