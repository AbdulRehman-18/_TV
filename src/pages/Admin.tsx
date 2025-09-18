import { Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { Sidebar } from '@/components/admin/Sidebar';
import { Dashboard } from '@/pages/admin/Dashboard';
import { Events } from '@/pages/admin/Events';
import { Announcements } from '@/pages/admin/Announcements';
import { Media } from '@/pages/admin/Media';
import { CalendarView } from '@/pages/admin/Calendar';
import { Settings } from '@/pages/admin/Settings';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Admin() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <div
        className={`flex-shrink-0 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-12' : 'w-56'
        }`}
      >
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSidebar}
                className="p-2 text-gray-700 bg-white"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Smart Corridor Display
                </h1>
                <p className="text-sm text-gray-500">Admin Dashboard</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/events" element={<Events />} />
            <Route path="/media" element={<Media />} />
            <Route path="/gallery" element={<div className="text-center py-12"><h2 className="text-xl text-gray-500">Gallery page coming soon</h2></div>} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}