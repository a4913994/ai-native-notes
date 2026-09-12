import i18n from "i18next";

export function timeago(time: string | number | Date) {
    const seconds = (new Date(time).getTime() - Date.now()) / 1000;
    const units = [[31536000, 'year'], [2592000, 'month'], [86400, 'day'], [3600, 'hour'], [60, 'minute'], [1, 'second']] as const;
    const [length, unit] = units.find(([length]) => Math.abs(seconds) >= length) || units[units.length - 1];
    return new Intl.RelativeTimeFormat(i18n.resolvedLanguage || 'zh-CN', { numeric: 'auto' }).format(Math.trunc(seconds / length), unit);
}
