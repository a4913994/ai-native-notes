import type { AIConfig } from "@rin/api";

export const WEBHOOK_URL_KEY = "WEBHOOK_URL";
export const SITE_LOCALES = ["zh-CN", "en", "zh-TW", "ja"] as const;
export const SITE_DESCRIPTIONS = {
  "zh-CN": "记录 AI Native 时代的技术笔记与项目实践。",
  en: "Technical notes and project practice in the AI-native era.",
  "zh-TW": "記錄 AI Native 時代的技術筆記與專案實踐。",
  ja: "AI ネイティブ時代の技術ノートとプロジェクト実践を記録します。",
} as const;

export const CLIENT_CONFIG_DEFAULTS = new Map(
  Object.entries({
    "cache.enabled": false,
    "counter.enabled": true,
    "friend_apply_enable": true,
    "header.behavior": "fixed",
    "header.layout": "classic",
    "feed.layout": "list",
    "feed.card_variant": "default",
    "theme.color": "#fc466b",
    "comment.enabled": true,
    "login.enabled": true,
    "site.name": "Rin",
    "site.description": "A lightweight personal blogging system",
    ...Object.fromEntries(SITE_LOCALES.map(locale => [`site.description.${locale}`, SITE_DESCRIPTIONS[locale]])),
    "site.avatar": "",
    "site.page_size": 5,
  }),
);

export const SERVER_CONFIG_DEFAULTS = new Map(
  Object.entries({
    friend_apply_auto_accept: false,
    friend_crontab: true,
    friend_ua: "Rin-Check/0.1.0",
    "webhook.method": "POST",
    "webhook.content_type": "application/json",
    "webhook.headers": "{}",
    "webhook.body_template": "{\"content\":\"{{message}}\"}",
  }),
);

export const CLIENT_CONFIG_ENV_DEFAULTS: Record<string, string> = {
  "site.name": "NAME",
  "site.description": "DESCRIPTION",
  "site.avatar": "AVATAR",
  "site.page_size": "PAGE_SIZE",
};

export const AI_CONFIG_PREFIX = "ai_summary.";

export const AI_CONFIG_KEYS = [
  `${AI_CONFIG_PREFIX}enabled`,
  `${AI_CONFIG_PREFIX}provider`,
  `${AI_CONFIG_PREFIX}model`,
  `${AI_CONFIG_PREFIX}api_key`,
  `${AI_CONFIG_PREFIX}api_url`,
] as const;

export const SENSITIVE_SERVER_CONFIG_FIELDS = [`${AI_CONFIG_PREFIX}api_key`] as const;

export const DEFAULT_AI_CONFIG: AIConfig = {
  enabled: false,
  provider: "openai",
  model: "gpt-4o-mini",
  api_key: "",
  api_url: "https://api.openai.com/v1",
};

export class ConfigWrapper {
  config: Record<string, unknown>;
  defaultConfig: Map<string, unknown>;

  constructor(config: Record<string, unknown>, defaultConfig: Map<string, unknown>) {
    this.config = config;
    this.defaultConfig = defaultConfig;
  }

  get<T>(key: string) {
    const value = this.config[key];
    if (value !== undefined && value !== "") {
      return value as T;
    }
    if (this.defaultConfig.has(key)) {
      return this.defaultConfig.get(key) as T;
    }
    return undefined;
  }

  default<T>(key: string) {
    return this.defaultConfig.get(key) as T;
  }

  getBoolean(key: string) {
    const value = this.get<unknown>(key);

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      const normalizedValue = value.trim().toLowerCase();

      if (normalizedValue === "true") {
        return true;
      }

      if (normalizedValue === "false") {
        return false;
      }
    }

    if (typeof value === "number") {
      return value !== 0;
    }

    return Boolean(value);
  }
}
