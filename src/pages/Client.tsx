import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Menu, LogOut, User as UserIcon, Upload, Home as HomeIcon, Settings as SettingsIcon } from 'lucide-react';
import type { Media, Client as ClientType } from '@/types';
import { ClientMediaCard } from '@/components/ClientMediaCard';
import { ClientMediaForm } from '@/components/ClientMediaForm';
import { ClientBottomNav } from '@/components/ClientBottomNav';
import { Settings } from '@/pages/client/Settings';

export function Client() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'upload' | 'settings'>('home');
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientProfile, setClientProfile] = useState<ClientType | null>(null);

  useEffect(() => {
    const loadClientProfile = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setClientProfile(data);
      } catch (error) {
        console.error('Error loading client profile:', error);
      }
    };

    const loadMedia = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('media')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMediaList(data || []);
      } catch (error) {
        console.error('Error loading media:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClientProfile();
    loadMedia();
  }, [user?.id]);

  const handleMediaUpload = (newMedia: Media) => {
    setMediaList(prev => [newMedia, ...prev]);
    setShowMediaForm(false);
  };

  const handleMediaDelete = (id: string) => {
    setMediaList(prev => prev.filter(m => m.id !== id));
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

  const getPendingCount = () => mediaList.filter(m => m.status === 'pending').length;
  const getApprovedCount = () => mediaList.filter(m => m.status === 'approved').length;
  const getRejectedCount = () => mediaList.filter(m => m.status === 'rejected').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <div className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'md:w-16' : 'md:w-64'} bg-white shadow-lg border-r`}>
        <div className="h-full flex flex-col w-full">
          <div className="p-3 md:p-4 border-b flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-base md:text-lg font-bold text-gray-900">Client Portal</h1>
                <p className="text-xs text-gray-600">Media Manager</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto">
            <div className="px-3 md:px-4 py-4 md:py-6 space-y-4">
              {/* Menu Section */}
              <div>
                {!sidebarCollapsed && (
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Menu</p>
                )}
                
                {/* Home */}
                <button
                  onClick={() => setActiveTab('home')}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors font-medium text-sm ${
                    activeTab === 'home'
                      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <HomeIcon className="w-5 h-5" />
                  {!sidebarCollapsed && <span>Home</span>}
                </button>

                {/* Upload */}
                <button
                  onClick={() => {
                    setActiveTab('upload');
                    setShowMediaForm(true);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors font-medium text-sm ${
                    activeTab === 'upload'
                      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Upload className="w-5 h-5" />
                  {!sidebarCollapsed && <span>Upload Media</span>}
                </button>

                {/* Settings */}
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors font-medium text-sm ${
                    activeTab === 'settings'
                      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <SettingsIcon className="w-5 h-5" />
                  {!sidebarCollapsed && <span>Settings</span>}
                </button>
              </div>
            </div>
          </nav>

          <div className="p-3 md:p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-center text-red-600 hover:text-red-700"
            >
              <LogOut className="w-4 h-4" />
              {!sidebarCollapsed && <span className="ml-2">Logout</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden pb-20 md:pb-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-3 md:px-6 py-3 md:py-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                {activeTab === 'home' && 'Media Manager'}
                {activeTab === 'upload' && 'Upload Media'}
                {activeTab === 'settings' && 'Settings'}
              </h2>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                {activeTab === 'home' && (clientProfile?.organization || 'Your Organization')}
                {activeTab === 'upload' && 'Upload and manage your media files'}
                {activeTab === 'settings' && 'Manage your profile and account information'}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {clientProfile?.name || user?.email}
                </p>
                <p className="text-xs text-gray-500">{clientProfile?.email}</p>
              </div>
              <div className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-3 md:p-6">
          {/* Home Tab */}
          {activeTab === 'home' && (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-500">Total Media</span>
                    <span className="text-2xl font-bold text-gray-900 mt-1">{mediaList.length}</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-500">Pending</span>
                    <span className="text-2xl font-bold text-amber-600 mt-1">{getPendingCount()}</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-500">Approved</span>
                    <span className="text-2xl font-bold text-emerald-600 mt-1">{getApprovedCount()}</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-500">Rejected</span>
                    <span className="text-2xl font-bold text-red-600 mt-1">{getRejectedCount()}</span>
                  </div>
                </div>
              </div>

              {/* Upload Button and Media List */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h3 className="text-lg font-semibold text-gray-900">My Media</h3>
                <Button
                  onClick={() => {
                    setActiveTab('upload');
                    setShowMediaForm(true);
                  }}
                  className="bg-gray-900 hover:bg-gray-800 text-white hidden md:inline-flex text-sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Media
                </Button>
              </div>

              {mediaList.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    No media uploaded yet
                  </h4>
                  <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                    Upload your first image or video to start displaying content on the TV screens
                  </p>
                  <Button
                    onClick={() => {
                      setActiveTab('upload');
                      setShowMediaForm(true);
                    }}
                    className="bg-gray-900 hover:bg-gray-800"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Media
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {mediaList.map(media => (
                    <ClientMediaCard
                      key={media.id}
                      media={media}
                      onDelete={handleMediaDelete}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="mb-6">
              {showMediaForm && (
                <ClientMediaForm
                  clientId={user?.id || ''}
                  onMediaUpload={handleMediaUpload}
                />
              )}
              {!showMediaForm && (
                <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Ready to upload?
                  </h4>
                  <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                    Click below to start uploading your media files
                  </p>
                  <Button
                    onClick={() => setShowMediaForm(true)}
                    className="bg-gray-900 hover:bg-gray-800"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Start Upload
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <Settings 
              clientProfile={clientProfile}
              onUpdate={setClientProfile}
            />
          )}
        </div>
      </div>

      {/* Bottom Navigation - Visible only on mobile */}
      <ClientBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
