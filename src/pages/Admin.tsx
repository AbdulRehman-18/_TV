import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { RotateCw } from 'lucide-react';

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

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    navigate('/login');
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
          sidebarCollapsed ? 'md:w-12' : 'md:w-56'
        }`}
      >
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden pb-20 md:pb-0">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-4 md:px-6 py-3 md:py-4 flex-shrink-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center space-x-3 md:space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSidebar}
                className="hidden md:inline-flex p-2 text-gray-700 bg-white"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg md:text-xl font-semibold text-gray-900">
                  Smart Corridor Display
                </h1>
                <p className="text-xs md:text-sm text-gray-500">Admin Dashboard</p>
              </div>
            </div>
            <div className="hidden md:flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => broadcastReload(false)}
                disabled={reloading}
                title="Soft reload TV display content"
                className="flex items-center justify-center gap-2 text-xs md:text-sm"
              >
                <RotateCw className={`w-4 h-4 ${reloading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Reload</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => broadcastReload(true)}
                disabled={reloading}
                title="Hard reload TV page (full refresh)"
                className="flex items-center justify-center gap-2 text-xs md:text-sm"
              >
                <RotateCw className={`w-4 h-4 ${reloading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Force</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-3 md:p-6">
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
      <BottomNav onRefresh={broadcastReload} onForce={() => broadcastReload(true)} onLogout={handleLogout} />
    </div>
  );
}