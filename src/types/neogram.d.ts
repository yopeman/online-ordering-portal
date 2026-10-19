declare module "neogram" {
  export class Bot {
    token: string;
    constructor(token: string, options?: Record<string, unknown>);
    getMe(): Promise<unknown>;
    sendMessage(options: {
      chat_id: number | string;
      text: string;
      parse_mode?: string;
      [key: string]: unknown;
    }): Promise<unknown>;
    [key: string]: unknown;
  }
}
