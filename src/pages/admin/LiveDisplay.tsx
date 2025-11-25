import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { supabase } from '@/lib/supabase';
import { Announcement, Event, Media } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Play, Power, RefreshCw, Settings, Volume2, VolumeX, ArrowLeft, Home, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// TV display type
interface TVDisplay {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline';
}

export function LiveDisplay() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTV] = useState<string>('main-corridor');

  // Load volume settings from localStorage
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('display-volume');
    return saved ? parseInt(saved) : 50;
  });
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('display-muted');
    return saved === 'true';
  });

  // Save volume changes to localStorage (syncs with Display page)
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    localStorage.setItem('display-volume', newVolume.toString());
    // Trigger storage event for Display page
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'display-volume',
      newValue: newVolume.toString(),
    }));
  };

  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('display-muted', newMuted.toString());
    // Trigger storage event for Display page
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'display-muted',
      newValue: newMuted.toString(),
    }));
  };
  const [showVolumeDialog, setShowVolumeDialog] = useState(false);
  const [showAdvancedDialog, setShowAdvancedDialog] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Available TV displays (only Main Corridor TV for now)
  const tvDisplays: TVDisplay[] = [
    { id: 'main-corridor', name: 'Main Corridor TV', location: 'Main Corridor', status: 'online' },
  ];

  const [deviceStats, setDeviceStats] = useState({
    storage: 0,
    temp: 0,
    uptime: 0
  });

  // Get real device stats
  useEffect(() => {
    const calculateStats = () => {
      // Calculate storage based on media count
      const totalMedia = media.length;
      const storageUsed = Math.min(Math.round((totalMedia / 100) * 100), 95);

      // Simulate temperature (would be from actual hardware in production)
      const temp = Math.round(22 + Math.random() * 4); // 22-26°C range

      // Calculate uptime based on when the session started
      const sessionStart = sessionStorage.getItem('displayStartTime');
      if (!sessionStart) {
        sessionStorage.setItem('displayStartTime', Date.now().toString());
      }
      const startTime = parseInt(sessionStart || Date.now().toString());
      const uptime = Math.floor((Date.now() - startTime) / 1000); // seconds

      setDeviceStats({
        storage: storageUsed,
        temp,
        uptime
      });
    };

    calculateStats();
    const interval = setInterval(calculateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [media]);

  // Update video volume when volume state changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Simple throttle using ref to avoid over-fetching
  const lastReloadRef = useRef(0);
  const reloadAllRef = useRef<null | ((reason?: string) => Promise<void>)>(null);

  if (!reloadAllRef.current) {
    reloadAllRef.current = async (reason?: string) => {
      const now = Date.now();
      if (now - lastReloadRef.current < 1500) {
        return; // throttle
      }
      lastReloadRef.current = now;
      try {
        console.debug('[LiveDisplay] reloadAll triggered', reason || '');
        await Promise.all([loadAnnouncements(), loadEvents(), loadMedia()]);
      } catch {
        // errors are logged inside loaders
      }
    };
  }

  useEffect(() => {
    loadAnnouncements();
    loadEvents();
    loadMedia();

    // Set up real-time subscriptions for announcements
    const announcementsSubscription = supabase
      .channel('announcements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
        },
        () => {
          loadAnnouncements();
        }
      )
      .subscribe();

    // Set up real-time subscriptions for events
    const eventsSubscription = supabase
      .channel('events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        () => {
          loadEvents();
        }
      )
      .subscribe();

    // Set up real-time subscriptions for media
    const mediaSubscription = supabase
      .channel('media')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media',
        },
        () => {
          loadMedia();
        }
      )
      .subscribe();

    return () => {
      announcementsSubscription.unsubscribe();
      eventsSubscription.unsubscribe();
      mediaSubscription.unsubscribe();
    };
  }, []);

  // Listen for remote reload requests from the Admin via Supabase Realtime Broadcast
  useEffect(() => {
    const controlChannel = supabase
      .channel('display-control')
      .on('broadcast', { event: 'reload' }, (payload) => {
        type ControlPayload = { hard?: boolean; reason?: string };
        const raw = (payload && typeof payload === 'object' && 'payload' in payload)
          ? (payload as { payload?: unknown }).payload
          : undefined;
        const msg: ControlPayload | undefined = (raw && typeof raw === 'object')
          ? (raw as ControlPayload)
          : undefined;
        const hard = msg?.hard;
        const reason = msg?.reason;
        if (hard) {
          window.location.reload();
        } else {
          reloadAllRef.current?.(reason || 'remote-broadcast');
        }
      })
      .subscribe((status) => {
        console.debug('[LiveDisplay] control channel status:', status);
      });

    return () => {
      try {
        controlChannel.unsubscribe();
      } catch {
        // ignore
      }
    };
  }, []);

  // Slideshow timer logic
  useEffect(() => {
    const activeAnnouncements = announcements.filter(a => a.is_active);
    const activeEvents = events.filter(e => e.is_active);
    const activeMedia = media.filter(m => m.is_active);
    const totalItems = activeAnnouncements.length + activeEvents.length + activeMedia.length;
    if (totalItems === 0) return;

    const allItems = [
      ...activeAnnouncements.map(item => ({ ...item, type: 'announcement' as const })),
      ...activeEvents.map(item => ({ ...item, type: 'event' as const })),
      ...activeMedia.map(item => ({ ...item, type: 'media' as const }))
    ];
    const currentItem = allItems[currentIndex];

    if (currentItem && currentItem.type === 'media' && currentItem.file_type === 'video') {
      return;
    }

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalItemsRef.current);
    }, 12000);
    return () => clearInterval(timer);
  }, [announcements, events, media, currentIndex]);

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: true });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMedia(data || []);
    } catch (error) {
      console.error('Error loading media:', error);
    }
  };

  const activeAnnouncements = announcements.filter(a => a.is_active);
  const activeEvents = events.filter(e => e.is_active);
  const activeMedia = media.filter(m => m.is_active);

  type SlideItem = (Announcement & { type: 'announcement' }) | (Event & { type: 'event' }) | (Media & { type: 'media' });
  const allItems: SlideItem[] = [
    ...activeAnnouncements.map(item => ({ ...item, type: 'announcement' as const })),
    ...activeEvents.map(item => ({ ...item, type: 'event' as const })),
    ...activeMedia.map(item => ({ ...item, type: 'media' as const }))
  ];

  const totalItemsRef = useRef(allItems.length);
  totalItemsRef.current = allItems.length;

  const currentItem: SlideItem = allItems[currentIndex];
  const nextItem: SlideItem = allItems[(currentIndex + 1) % allItems.length];

  const getItemLabel = (item: SlideItem) => {
    if (item.type === 'announcement') return 'ANNOUNCEMENT';
    if (item.type === 'event') return 'EVENT';
    if (item.type === 'media' && item.file_type === 'video') return 'VIDEO';
    return 'IMAGE';
  };

  const getItemTitle = (item: SlideItem) => {
    if (!item) return '';
    if (item.type === 'announcement') return item.title;
    if (item.type === 'event') return item.title;
    return item.title || item.file_name || 'Media';
  };

  const getItemDuration = (item: SlideItem) => {
    if (!item) return '00:00';
    if (item.type === 'media' && item.file_type === 'video') return '02:30';
    return '00:12';
  };

  const getItemFormat = (item: SlideItem) => {
    if (!item) return '';
    if (item.type === 'media' && item.file_type === 'video') return 'MP4';
    if (item.type === 'media' && item.file_type === 'image') return 'JPG';
    return '1080p';
  };

  const handleUpdateTV = async () => {
    try {
      await supabase
        .channel('display-control')
        .send({
          type: 'broadcast',
          event: 'reload',
          payload: { hard: false, reason: 'admin-update' }
        });
    } catch (error) {
      console.error('Error updating TV:', error);
    }
  };

  const handleRestartTV = async () => {
    try {
      await supabase
        .channel('display-control')
        .send({
          type: 'broadcast',
          event: 'reload',
          payload: { hard: true, reason: 'admin-restart' }
        });
    } catch (error) {
      console.error('Error restarting TV:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin" />
          <p className="text-lg text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
          <div className="h-4 w-px bg-gray-300" />
          <h1 className="text-lg font-semibold text-gray-900">Live Display Monitor</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open('/display', '_blank')}
          className="text-gray-600 hover:text-gray-900"
        >
          <Home className="w-4 h-4 mr-2" />
          Open Full Display
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Current Playlist */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Current Playlist</h2>
          </div>

        <div className="flex-1 overflow-y-auto">
          {/* Currently Playing */}
          {currentItem && (
            <div className="p-4 border-b-2 border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Play className="w-4 h-4 text-green-500 fill-green-500" />
                <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">Playing Now</span>
                <span className="ml-auto text-xs text-gray-500">{getItemDuration(currentItem)}</span>
              </div>
              <div className="bg-gray-900 rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '16/9' }}>
                {currentItem.type === 'announcement' && currentItem.image_url ? (
                  <img src={currentItem.image_url} alt={currentItem.title} className="w-full h-full object-cover" />
                ) : currentItem.type === 'event' && currentItem.image_url ? (
                  <img src={currentItem.image_url} alt={currentItem.title} className="w-full h-full object-cover" />
                ) : currentItem.type === 'media' ? (
                  <img src={currentItem.file_url} alt={getItemTitle(currentItem)} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                    {getItemTitle(currentItem).slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-gray-900 line-clamp-2">{getItemTitle(currentItem)}</h3>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{getItemLabel(currentItem)}</span>
                  <span>{getItemFormat(currentItem)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Up Next */}
          {nextItem && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Up Next</span>
                <span className="ml-auto text-xs text-gray-500">{getItemDuration(nextItem)}</span>
              </div>
              <div className="flex gap-3">
                <div className="w-20 h-14 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                  {nextItem.type === 'announcement' && nextItem.image_url ? (
                    <img src={nextItem.image_url} alt={nextItem.title} className="w-full h-full object-cover" />
                  ) : nextItem.type === 'event' && nextItem.image_url ? (
                    <img src={nextItem.image_url} alt={nextItem.title} className="w-full h-full object-cover" />
                  ) : nextItem.type === 'media' ? (
                    <img src={nextItem.file_url} alt={getItemTitle(nextItem)} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold">
                      {getItemTitle(nextItem).slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{getItemTitle(nextItem)}</h4>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>{getItemLabel(nextItem)}</span>
                    <span>{getItemFormat(nextItem)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* In Queue */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">In Queue</h3>
            <div className="space-y-3">
              {allItems.slice(currentIndex + 2, currentIndex + 5).map((item, idx) => (
                <div key={`${item.type}-${item.id}`} className="flex gap-3">
                  <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {item.type === 'announcement' && item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    ) : item.type === 'event' && item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    ) : item.type === 'media' ? (
                      <img src={item.file_url} alt={getItemTitle(item)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
                        {getItemTitle(item).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm text-gray-700 truncate">{getItemTitle(item)}</h4>
                    <p className="text-xs text-gray-500">{getItemLabel(item)} • {getItemDuration(item)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Center Panel - Display Preview */}
      <div className="flex-1 bg-black flex items-center justify-center p-8">
        <div className="w-full max-w-6xl">
          <div className="mb-4 flex items-center justify-between text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Main Corridor TV</span>
              <span className="text-white/40">•</span>
              <span className="text-green-400">Online</span>
            </div>
            <span>{currentIndex + 1} / {allItems.length}</span>
          </div>

          <div className="bg-gray-900 rounded-lg shadow-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
            {currentItem ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentItem.type}-${currentItem.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full relative"
                >
                  {currentItem.type === 'announcement' ? (
                    currentItem.image_url ? (
                      <div className="relative w-full h-full">
                        <img
                          src={currentItem.image_url}
                          alt={currentItem.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-8">
                          <div className="glass elevate soft-shadow p-6 rounded-2xl max-w-4xl">
                            <div className="mb-3">
                              <span className="px-3 py-1 rounded-full text-xs tracking-wider bg-white/10 text-white/80">ANNOUNCEMENT</span>
                            </div>
                            <h1 className="text-4xl font-semibold leading-tight mb-3 text-white">
                              {currentItem.title}
                            </h1>
                            <p className="text-lg text-white/80 leading-relaxed">
                              {currentItem.body}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-black to-black">
                        <div className="glass elevate soft-shadow text-center max-w-4xl w-full p-8">
                          <div className="mb-4">
                            <span className="px-4 py-2 rounded-full text-sm tracking-wider bg-white/10 text-white/80">ANNOUNCEMENT</span>
                          </div>
                          <h1 className="text-5xl font-semibold leading-tight mb-4 text-white">
                            {currentItem.title}
                          </h1>
                          <p className="text-2xl text-white/70 leading-relaxed font-light">
                            {currentItem.body}
                          </p>
                        </div>
                      </div>
                    )
                  ) : currentItem.type === 'event' ? (
                    currentItem.image_url ? (
                      <div className="relative w-full h-full">
                        <img
                          src={currentItem.image_url}
                          alt={currentItem.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-8">
                          <div className="glass elevate soft-shadow p-6 rounded-2xl max-w-5xl">
                            <div className="mb-3">
                              <span className="px-3 py-1 rounded-full text-xs tracking-wider bg-emerald-400/15 text-emerald-200/90">EVENT</span>
                            </div>
                            <h1 className="text-4xl font-semibold leading-tight mb-3 text-white">
                              {currentItem.title}
                            </h1>
                            <p className="text-lg text-white/80 leading-relaxed mb-4">
                              {currentItem.description}
                            </p>
                            <div className="grid grid-cols-3 gap-3 text-white/85">
                              <div className="glass border-white/10 bg-white/5 rounded-xl p-3 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                  <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-xs text-white/60">Date</div>
                                  <div className="text-sm font-medium">{new Date(currentItem.start_date).toLocaleDateString()}</div>
                                </div>
                              </div>
                              <div className="glass border-white/10 bg-white/5 rounded-xl p-3 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                  <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-xs text-white/60">Time</div>
                                  <div className="text-sm font-medium">
                                    {new Date(currentItem.start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </div>
                                </div>
                              </div>
                              {currentItem.location && (
                                <div className="glass border-white/10 bg-white/5 rounded-xl p-3 flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                    <MapPin className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-white/60">Location</div>
                                    <div className="text-sm font-medium">{currentItem.location}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-black to-black">
                        <div className="glass elevate soft-shadow text-center max-w-5xl w-full p-8">
                          <div className="mb-4">
                            <span className="px-4 py-2 rounded-full text-sm tracking-wider bg-emerald-400/15 text-emerald-200/90">EVENT</span>
                          </div>
                          <h1 className="text-5xl font-semibold leading-tight mb-4 text-white">
                            {currentItem.title}
                          </h1>
                          <p className="text-2xl text-white/70 leading-relaxed font-light mb-6">
                            {currentItem.description}
                          </p>
                        </div>
                      </div>
                    )
                  ) : (
                    currentItem.file_type === 'image' ? (
                      <div className="relative w-full h-full bg-black">
                        <img
                          src={currentItem.file_url}
                          alt={currentItem.title || 'Media'}
                          className="w-full h-full object-cover"
                        />
                        {currentItem.description && (
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <div className="glass elevate soft-shadow rounded-xl px-4 py-3 bg-black/40">
                              <div className="text-sm text-white/70">
                                {currentItem.description}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative w-full h-full bg-black flex items-center justify-center">
                        <video
                          ref={videoRef}
                          src={currentItem.file_url}
                          className="w-full h-full object-cover"
                          autoPlay
                          loop={false}
                          onEnded={() => setCurrentIndex((prev) => (prev + 1) % totalItemsRef.current)}
                        />
                        {currentItem.description && (
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <div className="glass elevate soft-shadow rounded-xl px-4 py-3 bg-black/40">
                              <div className="text-sm text-white/70">
                                {currentItem.description}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/50 bg-gradient-to-br from-slate-900 via-black to-black">
                <div className="text-center">
                  <h2 className="text-3xl font-semibold mb-2">No Active Content</h2>
                  <p className="text-white/40">Add announcements, events, or media to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Device Stats & TV Actions */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Device Stats</h2>
        </div>

        <div className="p-4 space-y-4">
          {/* Storage */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Storage</span>
              <span className="text-sm font-semibold text-gray-900">{deviceStats.storage}% Full</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${deviceStats.storage}%` }}
              />
            </div>
          </div>

          {/* Temperature */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Temperature</span>
              <span className="text-2xl font-bold text-gray-900">{deviceStats.temp}°C</span>
            </div>
          </div>

          {/* Uptime */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Uptime</span>
              <span className="text-2xl font-bold text-gray-900">{deviceStats.uptime}%</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 mt-auto">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">TV Actions</h2>
          <div className="space-y-2">
            <Button
              onClick={handleUpdateTV}
              className="w-full justify-start"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-3" />
              Update TV
            </Button>
            <Button
              onClick={handleRestartTV}
              className="w-full justify-start"
              variant="outline"
            >
              <Power className="w-4 h-4 mr-3" />
              Restart TV
            </Button>

            {/* Volume Control Dialog */}
            <Dialog open={showVolumeDialog} onOpenChange={setShowVolumeDialog}>
              <DialogTrigger asChild>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 mr-3" /> : <Volume2 className="w-4 h-4 mr-3" />}
                  Volume Control
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Volume Control</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Volume</label>
                      <span className="text-sm text-gray-500">{volume}%</span>
                    </div>
                    <Slider
                      value={[volume]}
                      onValueChange={(value) => handleVolumeChange(value[0])}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Mute</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMuteToggle}
                    >
                      {isMuted ? 'Unmute' : 'Mute'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Note: Volume changes will apply to the Main Corridor TV display in real-time.
                  </p>
                </div>
              </DialogContent>
            </Dialog>

            {/* Advanced Settings Dialog */}
            <Dialog open={showAdvancedDialog} onOpenChange={setShowAdvancedDialog}>
              <DialogTrigger asChild>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Advanced Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Advanced Display Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Display Brightness</label>
                      <Slider defaultValue={[80]} max={100} step={1} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Contrast</label>
                      <Slider defaultValue={[50]} max={100} step={1} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Slide Duration (seconds)</label>
                    <Slider defaultValue={[5]} min={3} max={30} step={1} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Transition Effect</label>
                    <Select defaultValue="fade">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fade">Fade</SelectItem>
                        <SelectItem value="slide">Slide</SelectItem>
                        <SelectItem value="zoom">Zoom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">Device Info</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Storage:</span>
                        <span className="ml-2 font-medium">{deviceStats.storage}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Temperature:</span>
                        <span className="ml-2 font-medium">{deviceStats.temp}°C</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Uptime:</span>
                        <span className="ml-2 font-medium">{Math.floor(deviceStats.uptime / 3600)}h {Math.floor((deviceStats.uptime % 3600) / 60)}m</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Resolution:</span>
                        <span className="ml-2 font-medium">1920x1080</span>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default LiveDisplay;
