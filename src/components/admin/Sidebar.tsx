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

export function Sidebar({ collapsed }: SidebarProps) {
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
    <div className="h-full flex flex-col bg-white border-r border-gray-100 overflow-hidden">
      {/* Top bar with logo */}
      <div className={`px-4 py-6 flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} flex-shrink-0 transition-all duration-300`}>
        <div className={`flex items-center justify-center ${collapsed ? 'w-10 h-10' : 'w-8 h-8'} bg-gray-900 rounded-xl flex-shrink-0 shadow-sm transition-all duration-300`}>
          <Monitor className={`text-white ${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
        </div>
        <div className={`flex-1 min-w-0 overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
          <h1 className="text-sm font-bold text-gray-900 truncate tracking-tight">Smart TV</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-6 space-y-2 overflow-y-auto ${collapsed ? 'px-3' : 'px-4'} transition-all duration-300`}>
        {navigationItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.exact}
            className={({ isActive }) => `group flex items-center ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2.5 w-full'} rounded-xl transition-all duration-200 ${isActive ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
            title={collapsed ? item.name : undefined}
          >
            {({ isActive }) => (
              <>
                <item.icon className={`flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'} ${collapsed ? 'h-5 w-5' : 'h-5 w-5'}`} />
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-3'}`}>
                  <span className="truncate text-sm whitespace-nowrap">{item.name}</span>
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className={`p-4 border-t border-gray-100 space-y-2 flex-shrink-0 ${collapsed ? 'px-3 flex flex-col items-center' : ''} transition-all duration-300`}>
        <Button
          variant="outline"
          size="sm"
          onClick={openLiveDisplay}
          className={`${collapsed ? 'w-10 h-10 p-0 justify-center' : 'w-full justify-start text-left'} transition-all duration-300`}
          title={collapsed ? 'Live Display' : undefined}
        >
          <Monitor className={`flex-shrink-0 h-4 w-4 ${collapsed ? '' : ''}`} />
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-3'}`}>
            <span className="whitespace-nowrap">Live Display</span>
          </div>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={`${collapsed ? 'w-10 h-10 p-0 justify-center' : 'w-full justify-start text-left'} text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-300`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className={`flex-shrink-0 h-4 w-4 ${collapsed ? '' : ''}`} />
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-3'}`}>
            <span className="whitespace-nowrap">Logout</span>
          </div>
        </Button>
      </div>
    </div>
  );
}
