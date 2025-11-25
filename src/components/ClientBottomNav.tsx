import { Home, Upload, Settings } from 'lucide-react';

interface ClientBottomNavProps {
  activeTab: 'home' | 'upload' | 'settings';
  onTabChange: (tab: 'home' | 'upload' | 'settings') => void;
}

export function ClientBottomNav({ activeTab, onTabChange }: ClientBottomNavProps) {
  const isActive = (tab: string) => activeTab === tab;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
      <div className="flex items-center justify-around px-4 py-2">
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center px-6 py-2 rounded-lg transition-all ${
            isActive('home') ? 'text-gray-900' : 'text-gray-500'
          }`}
        >
          <Home className={`w-5 h-5 ${isActive('home') ? 'text-gray-900' : ''}`} />
          <span className="text-xs mt-1 font-medium">Home</span>
        </button>

        <button
          onClick={() => onTabChange('upload')}
          className={`flex flex-col items-center justify-center px-6 py-2 rounded-lg transition-all ${
            isActive('upload') ? 'text-gray-900' : 'text-gray-500'
          }`}
        >
          <Upload className={`w-5 h-5 ${isActive('upload') ? 'text-gray-900' : ''}`} />
          <span className="text-xs mt-1 font-medium">Upload</span>
        </button>

        <button
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center justify-center px-6 py-2 rounded-lg transition-all ${
            isActive('settings') ? 'text-gray-900' : 'text-gray-500'
          }`}
        >
          <Settings className={`w-5 h-5 ${isActive('settings') ? 'text-gray-900' : ''}`} />
          <span className="text-xs mt-1 font-medium">Settings</span>
        </button>
      </div>
    </nav>
  );
}
