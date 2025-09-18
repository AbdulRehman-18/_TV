import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

export interface SettingsState {
  theme: Theme;
  slideshowInterval: number; // seconds
  autoplayVideos: boolean;
  showAnnouncementsOnDisplay: boolean;
  showEventsOnDisplay: boolean;
  notifyOnUpload: boolean;
}

const DEFAULT_SETTINGS: SettingsState = {
  theme: 'light',
  slideshowInterval: 12,
  autoplayVideos: true,
  showAnnouncementsOnDisplay: true,
  showEventsOnDisplay: true,
  notifyOnUpload: true,
};

const STORAGE_KEY = 'smart-tv-settings-v1';

export function useSettings() {
  const [settings, setSettings] = useState<SettingsState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as SettingsState;
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  const update = (patch: Partial<SettingsState>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  };

  const reset = () => setSettings(DEFAULT_SETTINGS);

  const exportSettings = () => JSON.stringify(settings, null, 2);

  const importSettings = (json: string) => {
    try {
      const parsed = JSON.parse(json) as SettingsState;
      setSettings(parsed);
      return true;
    } catch {
      return false;
    }
  };

  return { settings, update, reset, exportSettings, importSettings };
}
