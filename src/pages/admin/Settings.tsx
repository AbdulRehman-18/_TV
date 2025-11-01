import React, { useState, useRef } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function Settings() {
  const { settings, update, reset, exportSettings, importSettings } = useSettings();
  const [importJson, setImportJson] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  // theme toggle handled inline by the Switch component

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) || 5;
    update({ slideshowInterval: Math.max(3, Math.min(60, val)) });
  };

  const handleExport = () => {
    const json = exportSettings();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importJson) return alert('Paste settings JSON to import');
    const ok = importSettings(importJson);
    if (!ok) alert('Invalid JSON');
    else alert('Imported settings');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const txt = String(reader.result || '');
      const ok = importSettings(txt);
      if (!ok) alert('Invalid JSON');
      else alert('Imported settings from file');
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">Configure application behavior and display preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Theme</h3>
              <p className="text-sm text-gray-500">Switch between light and dark mode.</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">{settings.theme}</span>
              <Switch checked={settings.theme === 'dark'} onCheckedChange={(v) => {
                const enabled = Boolean(v);
                const newTheme = enabled ? 'dark' : 'light';
                update({ theme: newTheme });
                document.documentElement.classList.toggle('dark', enabled);
              }} />
            </div>
          </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Slideshow interval</h3>
              <p className="text-sm text-gray-500">Seconds between slides (images/videos).</p>
            </div>
            <div className="w-40">
              <Input type="number" value={settings.slideshowInterval} onChange={handleIntervalChange} />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Autoplay videos</h3>
              <p className="text-sm text-gray-500">Automatically play videos when they are shown.</p>
            </div>
            <Switch checked={settings.autoplayVideos} onCheckedChange={(v) => update({ autoplayVideos: Boolean(v) })} />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Show announcements on display</h3>
              <p className="text-sm text-gray-500">Include announcements in the public slideshow.</p>
            </div>
            <Switch checked={settings.showAnnouncementsOnDisplay} onCheckedChange={(v) => update({ showAnnouncementsOnDisplay: Boolean(v) })} />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Show events on display</h3>
              <p className="text-sm text-gray-500">Include events in the public slideshow.</p>
            </div>
            <Switch checked={settings.showEventsOnDisplay} onCheckedChange={(v) => update({ showEventsOnDisplay: Boolean(v) })} />
          </div>

        </div>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Notifications</h3>
            <p className="text-sm text-gray-500 mb-4">Control notification preferences.</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Notify on upload</div>
                  <div className="text-sm text-gray-500">Send a browser notification when a new media item is uploaded.</div>
                </div>
                <Switch checked={settings.notifyOnUpload} onCheckedChange={(v) => update({ notifyOnUpload: Boolean(v) })} />
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Import / Export</h3>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Button onClick={handleExport}>Export JSON</Button>
                <Button variant="outline" onClick={() => fileRef.current?.click()}>Import file</Button>
                <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleFileImport} />
              </div>
              <div className="mt-2">
                <Textarea value={importJson} onChange={(e) => setImportJson(e.target.value)} placeholder="Paste settings JSON here" />
                <div className="flex space-x-2 mt-2">
                  <Button onClick={handleImport}>Import JSON</Button>
                  <Button variant="destructive" onClick={reset}>Reset to defaults</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">System</h3>
            <p className="text-sm text-gray-500 mb-4">System-level controls and debug utilities.</p>
            <div className="space-y-2">
              <Button variant="outline" onClick={() => { alert('Clearing local cache...'); localStorage.clear(); }}>Clear local cache</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
