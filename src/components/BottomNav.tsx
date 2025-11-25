import { NavLink } from 'react-router-dom';
import {
  Home,
  Users,
  Plus,
  Settings,
  RotateCw
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface BottomNavProps {
  onRefresh?: (hard: boolean) => void;
  onForce?: () => void;
}

const quickAddItems = [
  { name: 'Announcements', href: '/admin/announcements', label: 'Announcement' },
  { name: 'Events', href: '/admin/events', label: 'Event' },
  { name: 'Media', href: '/admin/media', label: 'Media' },
];

export function BottomNav({ onRefresh, onForce }: BottomNavProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const handleQuickAdd = (href: string) => {
    window.location.href = href;
  };

  return (
    <>
      {/* Quick Add Menu - appears when plus button is clicked */}
      {showQuickAdd && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
          <div className="flex justify-center gap-2 p-3">
            {quickAddItems.map((item) => (
              <Button
                key={item.name}
                onClick={() => handleQuickAdd(item.href)}
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-sm"
                size="sm"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
        <div className="flex items-center justify-around px-4 py-2">
          {/* Home */}
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-all ${
              isActive ? 'text-gray-900' : 'text-gray-500'
            }`}
          >
            {({ isActive }) => (
              <>
                <Home className={`w-5 h-5 ${isActive ? 'text-gray-900' : ''}`} />
                <span className="text-xs mt-1 font-medium">Home</span>
              </>
            )}
          </NavLink>

          {/* Clients */}
          <NavLink
            to="/admin/clients"
            className={({ isActive }) => `flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-all ${
              isActive ? 'text-gray-900' : 'text-gray-500'
            }`}
          >
            {({ isActive }) => (
              <>
                <Users className={`w-5 h-5 ${isActive ? 'text-gray-900' : ''}`} />
                <span className="text-xs mt-1 font-medium">Clients</span>
              </>
            )}
          </NavLink>

          {/* Plus Button (Create) */}
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className={`flex flex-col items-center justify-center p-2 rounded-full transition-all ${
              showQuickAdd ? 'bg-gray-900 text-white' : 'bg-gray-900 text-white'
            }`}
          >
            <Plus className={`w-5 h-5 transition-transform ${showQuickAdd ? 'rotate-45' : ''}`} />
          </button>

          {/* Force Refresh */}
          <button
            onClick={() => {
              if (onForce) onForce();
              else onRefresh?.(true);
            }}
            className="flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-all text-gray-500"
          >
            <RotateCw className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Refresh</span>
          </button>

          {/* Settings */}
          <NavLink
            to="/admin/settings"
            className={({ isActive }) => `flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-all ${
              isActive ? 'text-gray-900' : 'text-gray-500'
            }`}
          >
            {({ isActive }) => (
              <>
                <Settings className={`w-5 h-5 ${isActive ? 'text-gray-900' : ''}`} />
                <span className="text-xs mt-1 font-medium">Settings</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </>
  );
}
