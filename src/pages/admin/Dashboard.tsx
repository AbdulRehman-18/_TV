import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Megaphone,
  Calendar,
  Activity,
  Image,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { Announcement, Event, Media } from '@/types';

export function Dashboard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'announcements' | 'events' | 'media'>('announcements');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (announcementsError) throw announcementsError;

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Fetch media
      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });

      if (mediaError) throw mediaError;

      setAnnouncements(announcementsData || []);
      setEvents(eventsData || []);
      setMedia(mediaData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: 'Total Announcements',
      value: announcements.length,
      icon: Megaphone,
      bgClass: 'bg-blue-50',
      textClass: 'text-blue-600',
    },
    {
      title: 'Total Events',
      value: events.length,
      icon: Calendar,
      bgClass: 'bg-green-50',
      textClass: 'text-green-600',
    },
    {
      title: 'Total Media',
      value: media.length,
      icon: Image,
      bgClass: 'bg-purple-50',
      textClass: 'text-purple-600',
    },
    {
      title: 'Active Content',
      value: announcements.filter(a => a.is_active).length +
        events.filter(e => e.is_active).length +
        media.filter(m => m.is_active).length,
      icon: Activity,
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-600',
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <div className="text-sm text-gray-500 font-medium">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Smart TV content management overview</p>
        </div>
        <div className="text-sm text-gray-400 font-medium bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Cards - Modern Minimal Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="group bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2 tracking-tight">
                  {stat.value}
                </h3>
              </div>
              <div className={`p-2 rounded-lg ${stat.bgClass} group-hover:scale-110 transition-transform duration-200`}>
                <stat.icon className={`w-5 h-5 ${stat.textClass}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Content Area - Tabs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px]">
            {/* Clean Tab Navigation */}
            <div className="flex border-b border-gray-100 px-2">
              {[
                { id: 'announcements', label: 'Announcements', icon: Megaphone, count: announcements.length },
                { id: 'events', label: 'Events', icon: Calendar, count: events.length },
                { id: 'media', label: 'Media', icon: Image, count: media.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${activeTab === tab.id
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className={`ml-1.5 py-0.5 px-2 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab Content Area */}
            <div className="p-2">
              {/* ANNOUNCEMENTS TAB */}
              {activeTab === 'announcements' && (
                <div className="space-y-1">
                  {announcements.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Megaphone className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No announcements yet</p>
                    </div>
                  ) : (
                    announcements.slice(0, 6).map((announcement) => (
                      <div key={announcement.id} className="group flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-default">
                        <div className={`w-1.5 h-1.5 rounded-full mr-4 flex-shrink-0 ${announcement.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-gray-300'
                          }`} />
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {announcement.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-500">
                              {new Date(announcement.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${announcement.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>
                          {announcement.is_active ? 'Active' : 'Draft'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* EVENTS TAB */}
              {activeTab === 'events' && (
                <div className="space-y-1">
                  {events.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No events scheduled</p>
                    </div>
                  ) : (
                    events.slice(0, 6).map((event) => (
                      <div key={event.id} className="group flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-default">
                        <div className={`w-1.5 h-1.5 rounded-full mr-4 flex-shrink-0 ${event.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-gray-300'
                          }`} />
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {event.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(event.start_date).toLocaleDateString()}
                            {event.location && <span className="text-gray-300 mx-1">|</span>}
                            {event.location}
                          </p>
                        </div>
                        <div className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${event.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>
                          {event.is_active ? 'Active' : 'Past'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* MEDIA TAB */}
              {activeTab === 'media' && (
                <div className="space-y-1">
                  {media.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Image className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No media uploaded</p>
                    </div>
                  ) : (
                    media.slice(0, 6).map((mediaItem) => (
                      <div key={mediaItem.id} className="group flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-default">
                        <div className={`w-1.5 h-1.5 rounded-full mr-4 flex-shrink-0 ${mediaItem.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-gray-300'
                          }`} />
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {mediaItem.title || 'Untitled Media'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                            {mediaItem.file_type}
                          </p>
                        </div>
                        <div className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${mediaItem.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>
                          {mediaItem.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Quick Summaries */}
        <div className="space-y-4">

          {/* System Status */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-900">System Status</h4>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
              <p className="text-sm text-emerald-800 font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Display Online
              </p>
            </div>
          </div>

          {/* Active Items Summary */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Live Content</h4>
            <p className="text-xs text-gray-500 mb-4">Currently visible on TV</p>

            <div className="flex items-baseline gap-1">
              <p className="text-4xl font-bold text-gray-900">
                {announcements.filter(a => a.is_active).length +
                  events.filter(e => e.is_active).length +
                  media.filter(m => m.is_active).length}
              </p>
              <span className="text-sm text-gray-500 font-medium">items</span>
            </div>
          </div>

          {/* Weekly Activity */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 shadow-sm text-white">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-300">New This Week</h4>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">
                {announcements.filter(a => {
                  const days = Math.ceil(Math.abs(new Date().getTime() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24));
                  return days <= 7;
                }).length +
                  events.filter(e => {
                    const days = Math.ceil(Math.abs(new Date().getTime() - new Date(e.created_at).getTime()) / (1000 * 60 * 60 * 24));
                    return days <= 7;
                  }).length +
                  media.filter(m => {
                    const days = Math.ceil(Math.abs(new Date().getTime() - new Date(m.created_at).getTime()) / (1000 * 60 * 60 * 24));
                    return days <= 7;
                  }).length}
              </p>
              <p className="text-xs text-gray-400 mt-1">Uploads & Updates</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}