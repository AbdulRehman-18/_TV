import { Home, Upload, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface ClientBottomNavProps {
  activeTab: 'home' | 'upload' | 'settings';
  onTabChange: (tab: 'home' | 'upload' | 'settings') => void;
  onLogout?: () => void;
}

export function ClientBottomNav({ activeTab, onTabChange, onLogout }: ClientBottomNavProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Attempt to sign out from Supabase
      await supabase.auth.signOut();
    } catch (error) {
      // Log error but continue with navigation
      console.error('Logout error:', error);
    }
    // Always call onLogout and navigate
    onLogout?.();
    navigate('/login', { replace: true });
  };

  const isActive = (tab: string) => activeTab === tab;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-3 py-2 flex items-center justify-between gap-2 md:hidden">
      <Button
        onClick={() => onTabChange('home')}
        variant={isActive('home') ? 'default' : 'ghost'}
        className={`flex-1 flex flex-col items-center justify-center gap-1 h-auto py-2 ${
          isActive('home') 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        size="sm"
      >
        <Home className="w-4 h-4" />
        <span className="text-xs">Home</span>
      </Button>
      
      <Button
        onClick={() => onTabChange('upload')}
        variant={isActive('upload') ? 'default' : 'ghost'}
        className={`flex-1 flex flex-col items-center justify-center gap-1 h-auto py-2 ${
          isActive('upload') 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        size="sm"
      >
        <Upload className="w-4 h-4" />
        <span className="text-xs">Upload</span>
      </Button>

      <Button
        onClick={() => onTabChange('settings')}
        variant={isActive('settings') ? 'default' : 'ghost'}
        className={`flex-1 flex flex-col items-center justify-center gap-1 h-auto py-2 ${
          isActive('settings') 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'text-gray-600 hover:bg-gray-100'
        }`}
        size="sm"
      >
        <Settings className="w-4 h-4" />
        <span className="text-xs">Settings</span>
      </Button>

      <Button
        onClick={handleLogout}
        variant="ghost"
        className="flex-1 flex flex-col items-center justify-center gap-1 h-auto py-2 text-red-600 hover:bg-red-50"
        size="sm"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-xs">Logout</span>
      </Button>
    </nav>
  );
}
