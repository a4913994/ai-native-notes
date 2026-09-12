import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { SITE_LOCALES } from "@rin/config";
import { client } from "../app/runtime";
import { removeAuthToken } from "../utils/auth";
import { useThemeMode } from "../utils/darkModeUtils";
import type { Profile } from "../state/profile";
import "./toolbar-controls.css";

type MenuItem = { label: string; action: () => void; selected?: boolean };
export function ToolbarMenu({ label, icon, children, items }: { label: string; icon?: string; children?: ReactNode; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  const close = () => { setOpen(false); trigger.current?.focus(); };
  return <div className="toolbar-menu" ref={root} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }} onKeyDown={event => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(); }
    if (open && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const buttons = Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
    }
  }}>
    <button type="button" className="toolbar-trigger" ref={trigger} aria-label={label} title={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
      {icon && <i className={icon} aria-hidden="true" />}{children}
    </button>
    {open && <div role="menu" aria-label={label} className="toolbar-panel" ref={panel}>
      {items.map(item => <button key={item.label} type="button" role={item.selected === undefined ? 'menuitem' : 'menuitemradio'} aria-checked={item.selected} onClick={() => { close(); item.action(); }}>
        <span>{item.label}</span>{item.selected && <i className="ri-check-line" aria-hidden="true" />}
      </button>)}
    </div>}
  </div>;
}

export function ThemeSwitch() {
  const { t } = useTranslation();
  const [mode, setMode] = useThemeMode();
  return <ToolbarMenu label={t('notebook.theme')} icon={mode === 'dark' ? 'ri-moon-line' : mode === 'light' ? 'ri-sun-line' : 'ri-computer-line'}
    items={(['light','dark','system'] as const).map(value => ({ label: t(`notebook.theme_${value}`), selected: mode === value, action: () => setMode(value) }))} />;
}

const languageNames = { 'zh-CN': '简体中文', en: 'English', 'zh-TW': '繁體中文', ja: '日本語' };
export function InterfaceLanguageSwitch() {
  const { t, i18n } = useTranslation();
  const active = i18n.resolvedLanguage || 'zh-CN';
  return <ToolbarMenu label={t('notebook.interface_language')} icon="ri-translate-2"
    items={SITE_LOCALES.map(locale => ({ label: languageNames[locale], selected: active === locale, action: () => { void i18n.changeLanguage(locale); } }))}><span>{t('notebook.interface_language')}</span></ToolbarMenu>;
}

export function AccountMenu({ profile, enabled }: { profile?: Profile | null; enabled: boolean }) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  if (!profile && !enabled) return null;
  if (!profile) return <button className="toolbar-trigger" title={t('login.title')} aria-label={t('login.title')} onClick={() => navigate('/login')}><i className="ri-user-line" aria-hidden="true" /></button>;
  return <ToolbarMenu label={t('profile.title')} icon="ri-user-line" items={[
    { label: t('profile.title'), action: () => navigate('/profile') },
    ...(profile.permission ? [{ label: t('admin.title'), action: () => navigate('/admin/writing') }] : []),
    { label: t('logout'), action: () => { void client.user.logout().then(() => { removeAuthToken(); window.location.reload(); }); } },
  ]} />;
}
