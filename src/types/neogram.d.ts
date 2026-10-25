declare module "neogram" {
  export interface TelegramChat {
    id: number | string;
    type?: string;
    title?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    [key: string]: unknown;
  }

  export interface TelegramMessage {
    message_id?: number;
    chat: TelegramChat;
    text?: string;
    date?: number;
    from?: {
      id: number | string;
      is_bot?: boolean;
      first_name?: string;
      last_name?: string;
      username?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }

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
    onMessage(
      fn: (msg: TelegramMessage) => void | Promise<void>,
      filters?: Record<string, unknown>,
    ): unknown;
    infinityPolling(options?: Record<string, unknown>): Promise<void>;
    stopPolling(): void;
    deleteWebhook(options?: {
      drop_pending_updates?: boolean;
    }): Promise<boolean>;
    [key: string]: unknown;
  }
}
