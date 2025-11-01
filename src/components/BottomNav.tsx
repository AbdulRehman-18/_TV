import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users,
  Plus,
  Settings, 
  RotateCw,
  LogOut
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface BottomNavProps {
  onRefresh?: (hard: boolean) => void;
  onForce?: () => void;
  onLogout?: () => void;
}

const quickAddItems = [
  { name: 'Announcements', href: '/admin/announcements', label: 'Announcement' },
  { name: 'Events', href: '/admin/events', label: 'Event' },
  { name: 'Media', href: '/admin/media', label: 'Media' },
];

export function BottomNav({ onRefresh, onForce, onLogout }: BottomNavProps) {
  const navigate = useNavigate();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [fabPos, setFabPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleQuickAdd = (href: string) => {
    window.location.href = href;
  };

  const handleLogout = async () => {
    try {
      // Attempt to sign out from Supabase
      await supabase.auth.signOut();
    } catch (error) {
      // Log error but continue with navigation
      console.error('Logout error:', error);
    }
    // Always navigate to login
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Quick Add Menu - appears when plus button is clicked */}
      {showQuickAdd && (
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
          <div className="flex justify-center gap-2 p-3">
            {quickAddItems.map((item) => (
              <Button
                key={item.name}
                onClick={() => handleQuickAdd(item.href)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                size="sm"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Force FAB (draggable) - mobile only */}
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          setFabPos({ x: e.clientX, y: e.clientY });
          setDragging(true);
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          setFabPos({ x: t.clientX, y: t.clientY });
          setDragging(true);
        }}
        onMouseUp={() => setDragging(false)}
        onTouchEnd={() => setDragging(false)}
        onMouseMove={(e) => {
          if (!dragging) return;
          setFabPos({ x: e.clientX, y: e.clientY });
        }}
        onTouchMove={(e) => {
          if (!dragging) return;
          const t = e.touches[0];
          setFabPos({ x: t.clientX, y: t.clientY });
        }}
        onClick={() => {
          // call provided onForce, otherwise fallback to hard refresh via onRefresh
          if (onForce) onForce();
          else onRefresh?.(true);
        }}
        title="Force Reload"
        className="md:hidden fixed z-50"
        style={{
          right: fabPos ? Math.max(12, window.innerWidth - fabPos.x - 28) : 16,
          bottom: fabPos ? Math.max(12, window.innerHeight - fabPos.y - 28) : 84,
        }}
      >
        <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
          <RotateCw className="w-5 h-5" />
        </div>
      </button>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-3 flex items-center justify-between md:hidden z-40">
        {/* Home */}
        <NavLink
          to="/admin"
          end
          className={({ isActive }) => `flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 ${
            isActive 
              ? 'text-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          title="Home"
        >
          {({ isActive }) => (
            <>
              <Home className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
              <span className="text-xs mt-1">Home</span>
            </>
          )}
        </NavLink>

        {/* Clients */}
        <NavLink
          to="/admin/clients"
          className={({ isActive }) => `flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 ${
            isActive 
              ? 'text-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          title="Clients"
        >
          {({ isActive }) => (
            <>
              <Users className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
              <span className="text-xs mt-1">Clients</span>
            </>
          )}
        </NavLink>

        {/* Plus Button (Create) - Center button */}
        <button
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          className={`flex flex-col items-center justify-center p-3 rounded-full transition-all duration-200 transform hover:scale-110 ${
            showQuickAdd
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-blue-600 text-white shadow-md hover:shadow-lg'
          }`}
          title="Create"
        >
          <Plus className={`w-6 h-6 transition-transform duration-200 ${showQuickAdd ? 'rotate-45' : ''}`} />
        </button>

        {/* Settings */}
        <NavLink
          to="/admin/settings"
          className={({ isActive }) => `flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 ${
            isActive 
              ? 'text-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          title="Settings"
        >
          {({ isActive }) => (
            <>
              <Settings className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
              <span className="text-xs mt-1">Settings</span>
            </>
          )}
        </NavLink>

        {/* Logout */}
        <button
          onClick={() => { if (onLogout) onLogout(); else handleLogout(); }}
          className="flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 text-gray-600 hover:text-red-600"
          title="Logout"
        >
          <LogOut className="w-6 h-6 text-gray-600" />
          <span className="text-xs mt-1">Logout</span>
        </button>
      </nav>
    </>
  );
}
