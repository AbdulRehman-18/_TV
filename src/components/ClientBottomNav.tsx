import { Home, Image, Megaphone, Calendar, Settings } from 'lucide-react';

type TabType = 'home' | 'media' | 'announcements' | 'events' | 'settings';

interface ClientBottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function ClientBottomNav({ activeTab, onTabChange }: ClientBottomNavProps) {
  const isActive = (tab: string) => activeTab === tab;

  const navItems = [
    { id: 'home' as TabType, icon: Home, label: 'Home' },
    { id: 'media' as TabType, icon: Image, label: 'Media' },
    { id: 'announcements' as TabType, icon: Megaphone, label: 'News' },
    { id: 'events' as TabType, icon: Calendar, label: 'Events' },
    { id: 'settings' as TabType, icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all ${isActive(item.id) ? 'text-gray-900' : 'text-gray-500'
              }`}
          >
            <item.icon className={`w-5 h-5 ${isActive(item.id) ? 'text-gray-900' : ''}`} />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
