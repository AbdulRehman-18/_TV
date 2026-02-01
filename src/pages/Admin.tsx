import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Sidebar } from '@/components/admin/Sidebar';
import { BottomNav } from '@/components/BottomNav';
import { Dashboard } from '@/pages/admin/Dashboard';
import { Events } from '@/pages/admin/Events';
import { Announcements } from '@/pages/admin/Announcements';
import { Media } from '@/pages/admin/Media';
import { Clients } from '@/pages/admin/Clients';
import { CalendarView } from '@/pages/admin/Calendar';
import { Settings } from '@/pages/admin/Settings';
import { LiveDisplay } from '@/pages/admin/LiveDisplay';
import { PanelLeftClose, PanelLeftOpen, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export function Admin() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [controlReady, setControlReady] = useState(false);
  const controlChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const location = useLocation();
  const isLiveDisplayRoute = location.pathname === '/admin/live-display';

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Set up (or ensure) a realtime control channel
  useEffect(() => {
    const ch = supabase.channel('display-control');
    controlChannelRef.current = ch;
    ch.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        setControlReady(true);
        console.debug('[Admin] control channel subscribed');
      }
    });
    return () => {
      try { ch.unsubscribe(); } catch { /* ignore */ }
      controlChannelRef.current = null;
      setControlReady(false);
    };
  }, []);

  const broadcastReload = async (hard = false) => {
    setReloading(true);
    const send = async () => {
      try {
        await controlChannelRef.current?.send({
          type: 'broadcast',
          event: 'reload',
          payload: { hard, reason: 'admin-button' },
        });
      } catch (err) {
        console.error('Failed to broadcast reload:', err);
      } finally {
        setReloading(false);
      }
    };

    if (controlReady) {
      await send();
    } else {
      // Wait for subscription then send
      const ch = controlChannelRef.current ?? supabase.channel('display-control');
      controlChannelRef.current = ch;
      ch.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setControlReady(true);
          await send();
        }
      });
    }
  };



  // If on live display route, render full screen without layout
  if (isLiveDisplayRoute) {
    return <LiveDisplay />;
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <div
        className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'md:w-20' : 'md:w-64'
        }`}
      >
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden pb-20 md:pb-0 bg-gray-50/50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 flex-shrink-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className="hidden md:flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="w-5 h-5" />
                ) : (
                  <PanelLeftClose className="w-5 h-5" />
                )}
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                  Smart Corridor Display
                </h1>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => broadcastReload(false)}
                disabled={reloading}
                title="Soft reload TV display content"
                className="h-9 px-4 text-xs font-medium border-gray-200 hover:bg-gray-50 hover:text-gray-900"
              >
                <RotateCw className={`w-3.5 h-3.5 mr-2 ${reloading ? 'animate-spin' : ''}`} />
                Reload Display
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => broadcastReload(true)}
                disabled={reloading}
                title="Hard reload TV page (full refresh)"
                className="h-9 px-4 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Force Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/events" element={<Events />} />
            <Route path="/media" element={<Media />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/gallery" element={<div className="text-center py-12"><h2 className="text-xl text-gray-500">Gallery page coming soon</h2></div>} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>

      {/* Bottom Navigation - Visible only on mobile */}
      <BottomNav />
    </div>
  );
}