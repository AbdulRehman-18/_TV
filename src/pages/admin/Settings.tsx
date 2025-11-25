import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Download, Upload, RotateCcw, Trash2, CheckCircle2, X, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function Settings() {
  const navigate = useNavigate();
  const { settings, update, reset, exportSettings, importSettings } = useSettings();
  const [importJson, setImportJson] = useState('');
  const [showImportSection, setShowImportSection] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Logout error:', error);
      }
      navigate('/login', { replace: true });
    }
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) || 5;
    const clamped = Math.max(3, Math.min(60, val));
    update({ slideshowInterval: clamped });
  };

  const handleExport = () => {
    const json = exportSettings();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('success', 'Settings exported');
  };

  const handleImport = () => {
    if (!importJson.trim()) {
      showNotification('error', 'Paste settings JSON to import');
      return;
    }
    const ok = importSettings(importJson);
    if (!ok) {
      showNotification('error', 'Invalid JSON format');
    } else {
      showNotification('success', 'Settings imported');
      setImportJson('');
      setShowImportSection(false);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const txt = String(reader.result || '');
      const ok = importSettings(txt);
      if (!ok) {
        showNotification('error', 'Invalid JSON file');
      } else {
        showNotification('success', 'Settings imported from file');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('Reset all settings to defaults?')) {
      reset();
      showNotification('success', 'Settings reset');
    }
  };

  const handleClearCache = () => {
    if (window.confirm('Clear cache? You will be signed out.')) {
      localStorage.clear();
      setTimeout(() => window.location.href = '/login', 500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure display behavior and preferences</p>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-50 text-green-900 border border-green-200' : 'bg-red-50 text-red-900 border border-red-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Import Section */}
      {showImportSection && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Import Settings</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowImportSection(false)}>Cancel</Button>
          </div>
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full text-sm">
            Choose File
          </Button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleFileImport} />
          <div className="text-center text-xs text-gray-400">or</div>
          <Textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder="Paste JSON here"
            className="text-sm font-mono h-24"
          />
          <Button onClick={handleImport} className="w-full text-sm">Import</Button>
        </div>
      )}

      <div className="space-y-6">
        {/* Display Content */}
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
          <div className="p-4">
            <h2 className="text-sm font-medium text-gray-900">Display Content</h2>
            <p className="text-xs text-gray-500 mt-0.5">Control what appears on the display</p>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Show Announcements</div>
                <div className="text-xs text-gray-500">Display announcements in slideshow</div>
              </div>
              <Switch
                checked={settings.showAnnouncementsOnDisplay}
                onCheckedChange={(v) => update({ showAnnouncementsOnDisplay: Boolean(v) })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Show Events</div>
                <div className="text-xs text-gray-500">Display events in slideshow</div>
              </div>
              <Switch
                checked={settings.showEventsOnDisplay}
                onCheckedChange={(v) => update({ showEventsOnDisplay: Boolean(v) })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Show Media</div>
                <div className="text-xs text-gray-500">Display media files in slideshow</div>
              </div>
              <Switch
                checked={settings.showMediaOnDisplay}
                onCheckedChange={(v) => update({ showMediaOnDisplay: Boolean(v) })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Show Date & Time</div>
                <div className="text-xs text-gray-500">Display date and time overlay</div>
              </div>
              <Switch
                checked={settings.showDateTimeOnDisplay}
                onCheckedChange={(v) => update({ showDateTimeOnDisplay: Boolean(v) })}
              />
            </div>
          </div>
        </div>

        {/* Playback */}
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
          <div className="p-4">
            <h2 className="text-sm font-medium text-gray-900">Playback</h2>
            <p className="text-xs text-gray-500 mt-0.5">Configure slideshow timing</p>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-900 block mb-2">Slideshow Interval</label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="3"
                  max="60"
                  value={settings.slideshowInterval}
                  onChange={handleIntervalChange}
                  className="w-20 text-center"
                />
                <span className="text-sm text-gray-600">seconds</span>
              </div>
              <input
                type="range"
                min="3"
                max="60"
                value={settings.slideshowInterval}
                onChange={handleIntervalChange}
                className="w-full mt-3"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Autoplay Videos</div>
                <div className="text-xs text-gray-500">Automatically play video files</div>
              </div>
              <Switch
                checked={settings.autoplayVideos}
                onCheckedChange={(v) => update({ autoplayVideos: Boolean(v) })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Smooth Transitions</div>
                <div className="text-xs text-gray-500">Enable slide transitions</div>
              </div>
              <Switch
                checked={settings.enableTransitions}
                onCheckedChange={(v) => update({ enableTransitions: Boolean(v) })}
              />
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
          <div className="p-4">
            <h2 className="text-sm font-medium text-gray-900">Appearance</h2>
            <p className="text-xs text-gray-500 mt-0.5">Interface preferences</p>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-900 block mb-2">Display Name</label>
              <Input
                type="text"
                value={settings.displayName}
                onChange={(e) => update({ displayName: e.target.value })}
                placeholder="Main Corridor TV"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Dark Mode</div>
                <div className="text-xs text-gray-500">Use dark theme</div>
              </div>
              <Switch
                checked={settings.theme === 'dark'}
                onCheckedChange={(v) => {
                  const newTheme = v ? 'dark' : 'light';
                  update({ theme: newTheme });
                  document.documentElement.classList.toggle('dark', v);
                }}
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
          <div className="p-4">
            <h2 className="text-sm font-medium text-gray-900">Notifications</h2>
            <p className="text-xs text-gray-500 mt-0.5">Alert preferences</p>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Upload Notifications</div>
                <div className="text-xs text-gray-500">Notify when media is uploaded</div>
              </div>
              <Switch
                checked={settings.notifyOnUpload}
                onCheckedChange={(v) => update({ notifyOnUpload: Boolean(v) })}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
          <div className="p-4">
            <h2 className="text-sm font-medium text-gray-900">Actions</h2>
            <p className="text-xs text-gray-500 mt-0.5">Import, export, and reset</p>
          </div>

          <div className="p-4 space-y-2">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport} className="flex-1 text-sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={() => setShowImportSection(!showImportSection)} className="flex-1 text-sm">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </div>
            <Button variant="outline" onClick={handleReset} className="w-full text-sm text-amber-600 hover:text-amber-700">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button variant="outline" onClick={handleClearCache} className="w-full text-sm text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>
          </div>
        </div>

        {/* Account */}
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
          <div className="p-4">
            <h2 className="text-sm font-medium text-gray-900">Account</h2>
            <p className="text-xs text-gray-500 mt-0.5">Sign out of your account</p>
          </div>

          <div className="p-4">
            <Button variant="outline" onClick={handleLogout} className="w-full text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-500 pb-8">
        Settings are saved automatically to local storage.
      </div>
    </div>
  );
}
