import { describe, expect, it } from 'bun:test';
import { createInstance } from 'i18next';
import { languageOptions } from '../language-options';
import zh from '../../../public/locales/zh-CN/translation.json';
import en from '../../../public/locales/en/translation.json';
import tw from '../../../public/locales/zh-TW/translation.json';
import ja from '../../../public/locales/ja/translation.json';
import { CLIENT_CONFIG_DEFAULTS, SITE_DESCRIPTIONS, SITE_LOCALES } from '@rin/config';

describe('Interface language preferences and public translations', () => {
  const resources = { 'zh-CN': { translation: zh }, en: { translation: en }, 'zh-TW': { translation: tw }, ja: { translation: ja } };
  it('starts in Chinese without navigator detection and restores an explicitly saved language', async () => {
    expect(languageOptions.detection.order).toEqual(['localStorage']);
    const instance = createInstance();
    await instance.init({ ...languageOptions, resources });
    expect(instance.resolvedLanguage).toBe('zh-CN');
    const restored = createInstance();
    restored.use({ type: 'languageDetector', detect: () => 'en', init() {}, cacheUserLanguage() {} });
    await restored.init({ ...languageOptions, resources });
    expect(restored.resolvedLanguage).toBe('en');
    await restored.changeLanguage('ja');
    expect(restored.t('notebook.recent')).toBe(ja.notebook.recent);
  });
  it('supplies every homepage key and distinct configured descriptions for all retained languages', () => {
    for (const locale of SITE_LOCALES) {
      const translations = resources[locale].translation.notebook as Record<string, string>;
      for (const key of Object.keys(zh.notebook)) {
        expect(translations[key]?.trim()).toBeTruthy();
        expect(translations[key]).not.toBe(`notebook.${key}`);
      }
      expect(CLIENT_CONFIG_DEFAULTS.get(`site.description.${locale}`)).toBe(SITE_DESCRIPTIONS[locale]);
    }
  });
});
