// Only a visitor's explicit, persisted preference overrides the Chinese default.
export const languageOptions = {
  fallbackLng: 'zh-CN',
  supportedLngs: ['zh-CN', 'en', 'zh-TW', 'ja'],
  load: 'currentOnly' as const,
  detection: { order: ['localStorage'], caches: ['localStorage'] },
};
