import { useState } from 'react';
import { LogOut, Settings, User, ChevronDown } from 'lucide-react';
import { Client } from '@/types';


interface ClientHeaderProps {
  clientProfile: Client | null;
  userEmail?: string | null;
  onLogout: () => void;
  onSettingsClick: () => void;
}

export function ClientHeader({ clientProfile, userEmail, onLogout, onSettingsClick }: ClientHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {clientProfile?.organization || 'Dashboard'}
          </h1>
          <p className="text-xs text-gray-500 font-medium">Content Management Portal</p>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-1 rounded-full hover:bg-gray-50 transition-colors focus:outline-none"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">
                {clientProfile?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500">{clientProfile?.email || userEmail}</p>
            </div>
            <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center shadow-sm text-white transition-transform hover:scale-105">
              <User className="w-5 h-5" />
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsProfileOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-gray-100 sm:hidden">
                  <p className="text-sm font-semibold text-gray-900">
                    {clientProfile?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{clientProfile?.email || userEmail}</p>
                </div>
                
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onSettingsClick();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                  Settings
                </button>
                
                <div className="my-1 border-t border-gray-100" />
                
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
