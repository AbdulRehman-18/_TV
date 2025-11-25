import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Megaphone, 
  Calendar, 
  Video,  
  Users,
  Settings, 
  Monitor,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

const navigationItems = [
  { name: 'Home', href: '/admin', icon: Home, exact: true },
  { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { name: 'Events', href: '/admin/events', icon: Calendar },
  { name: 'Media', href: '/admin/media', icon: Video },
  { name: 'Clients', href: '/admin/clients', icon: Users },
  { name: 'Calendar', href: '/admin/calendar', icon: Calendar },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();

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

  const openLiveDisplay = () => {
    navigate('/admin/live-display');
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200 overflow-hidden">
      {/* Top bar with logo and collapse button */}
      <div className={`px-3 py-3 border-b border-gray-200 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} flex-shrink-0`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className={`flex items-center justify-center ${collapsed ? 'w-8 h-8' : 'w-9 h-9'} bg-gray-900 rounded-lg flex-shrink-0`}>
            <Monitor className={`text-white ${collapsed ? 'w-4 h-4' : 'w-5 h-5'}`} />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-semibold text-gray-900 truncate">Smart TV</h1>
              <p className="text-xs text-gray-500 truncate">Admin Panel</p>
            </div>
          )}
        </div>
        {/* Collapse/Expand button (X style in screenshot) */}
        <button
          type="button"
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-700 rounded-md p-1 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
        </button>
      </div>

      {/* Navigation */}
  <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.exact}
            className={({ isActive }) => `group flex items-center ${collapsed ? 'justify-center px-2' : 'px-3'} py-2 rounded-lg transition-all duration-200 ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            title={collapsed ? item.name : undefined}
          >
            {({ isActive }) => (
              <>
                <item.icon className={`transition-colors duration-200 ${isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'} ${collapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'}`} />
                {!collapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className={`p-4 border-t border-gray-200 space-y-2 flex-shrink-0 ${collapsed ? 'px-2' : ''}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={openLiveDisplay}
          className={`w-full ${collapsed ? 'px-2' : 'justify-start text-left'}`}
          title={collapsed ? 'Live Display' : undefined}
        >
          <Monitor className={`h-4 w-4 ${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && 'Live Display'}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={`w-full ${collapsed ? 'px-2' : 'justify-start text-left'} text-gray-600 hover:text-red-600 hover:bg-red-50`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className={`h-4 w-4 ${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && 'Logout'}
        </Button>
      </div>
    </div>
  );
}
