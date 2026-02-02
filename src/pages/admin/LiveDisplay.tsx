import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Announcement, Event, Media } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Play, Power, RefreshCw, Volume2, VolumeX, ArrowLeft, Home, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useSettings } from '@/hooks/useSettings';
import { useScheduler } from '@/hooks/useScheduler';

export function LiveDisplay() {
  const navigate = useNavigate();
  const { getContentToDisplay } = useScheduler();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  // Sync currentIndex with Display page via localStorage
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = localStorage.getItem('display-current-index');
    return saved ? parseInt(saved) : 0;
  });
  const [loading, setLoading] = useState(true);

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
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get settings for slideshow interval
  const { settings } = useSettings();

  // Listen for currentIndex changes from Display page
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'display-current-index' && e.newValue) {
        setCurrentIndex(parseInt(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);



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


  // Use scheduler to get content to display (handles emergency, scheduled, and fallback)
  const { items: scheduledContent } = getContentToDisplay(
    announcements,
    events,
    media
  );

  // Apply settings filters (user can toggle announcement/event/media display)
  const filteredContent = scheduledContent.filter(item => {
    if ('body' in item) return settings.showAnnouncementsOnDisplay; // Announcement
    if ('location' in item) return settings.showEventsOnDisplay; // Event
    if ('file_url' in item) return settings.showMediaOnDisplay; // Media
    return true;
  });

  // Combine into slideshow items with type tags
  type SlideItem = (Announcement & { type: 'announcement' }) | (Event & { type: 'event' }) | (Media & { type: 'media' });
  const allItems: SlideItem[] = filteredContent.map(item => {
    if ('body' in item) return { ...item as Announcement, type: 'announcement' as const };
    if ('location' in item) return { ...item as Event, type: 'event' as const };
    return { ...item as Media, type: 'media' as const };
  });


  const totalItemsRef = useRef(allItems.length);
  totalItemsRef.current = allItems.length;

  const currentItem: SlideItem = allItems[currentIndex];
  const nextItem: SlideItem = allItems[(currentIndex + 1) % allItems.length];

  // Slideshow timer logic
  useEffect(() => {
    if (allItems.length === 0) return;

    const currentItem = allItems[currentIndex];

    if (currentItem && currentItem.type === 'media' && currentItem.file_type === 'video') {
      return;
    }

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalItemsRef.current);
    }, settings.slideshowInterval * 1000);
    return () => clearInterval(timer);
  }, [allItems, currentIndex, settings.slideshowInterval]);


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
    // Use settings.slideshowInterval for non-video items
    const seconds = settings.slideshowInterval;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0 z-20 shadow-sm relative">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Back to Admin</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div className="h-4 w-px bg-gray-300" />
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Live Monitor</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open('/display', '_blank')}
          className="text-gray-600 hover:text-gray-900 border-gray-200 hover:border-gray-300 shadow-sm"
        >
          <Home className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Open Full Display</span>
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col lg:grid lg:grid-cols-[380px_1fr_320px] overflow-y-auto lg:overflow-hidden">

          {/* Left Panel - Current Playlist */}
          {/* On Mobile: Order 3 (Bottom) */}
          <div className="order-3 lg:order-1 w-full bg-white border-t lg:border-t-0 lg:border-r border-gray-200 flex flex-col h-[500px] lg:h-full lg:overflow-hidden shadow-sm lg:shadow-none z-10">
            <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Current Playlist</h2>
                <div className="text-xs text-gray-400 font-medium">{allItems.length} items</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Currently Playing */}
              {currentItem && (
                <div className="p-3 lg:p-4 border-b border-gray-100 bg-green-50/30">
                  <div className="flex items-center gap-2 mb-2 lg:mb-3">
                    <div className="relative flex h-2.5 w-2.5 lg:h-3 lg:w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 lg:h-3 lg:w-3 bg-green-500"></span>
                    </div>
                    <span className="text-[10px] lg:text-xs font-bold text-green-700 uppercase tracking-wider">Playing Now</span>
                    <span className="ml-auto text-[10px] lg:text-xs font-mono text-gray-500 bg-white px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-md border border-gray-200 shadow-sm">{getItemDuration(currentItem)}</span>
                  </div>

                  {/* Compact Mobile Row / Full Card Desktop */}
                  <div className="flex lg:block gap-3">
                    <div className="w-20 h-14 lg:w-full lg:h-auto lg:aspect-video bg-gray-900 rounded-md lg:rounded-lg overflow-hidden lg:mb-3 shadow-sm lg:shadow-md ring-1 ring-black/5 flex-shrink-0">
                      {currentItem.type === 'announcement' && currentItem.image_url ? (
                        <img src={currentItem.image_url} alt={currentItem.title} className="w-full h-full object-cover lg:object-contain" />
                      ) : currentItem.type === 'event' && currentItem.image_url ? (
                        <img src={currentItem.image_url} alt={currentItem.title} className="w-full h-full object-cover lg:object-contain" />
                      ) : currentItem.type === 'media' ? (
                        <img src={currentItem.file_url} alt={getItemTitle(currentItem)} className="w-full h-full object-cover lg:object-contain" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-xs lg:text-2xl font-bold bg-gradient-to-br from-gray-800 to-gray-900">
                          {getItemTitle(currentItem).slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5 lg:space-y-1 flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="text-sm lg:text-base font-semibold text-gray-900 line-clamp-2 leading-tight">{getItemTitle(currentItem)}</h3>
                      <div className="flex items-center justify-between text-[10px] lg:text-xs text-gray-500 mt-1 lg:mt-2">
                        <span className="px-1.5 py-0.5 rounded-full bg-gray-100 font-medium text-gray-600 truncate">{getItemLabel(currentItem)}</span>
                        <span className="font-mono text-gray-400 hidden lg:inline">{getItemFormat(currentItem)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Up Next - Desktop Card */}
              {nextItem && (
                <div className="p-4 border-b border-gray-100 hidden lg:block">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Up Next</span>
                    <span className="ml-auto text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">{getItemDuration(nextItem)}</span>
                  </div>
                  <div className="flex gap-3 group cursor-default">
                    <div className="w-24 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow ring-1 ring-black/5">
                      {nextItem.type === 'announcement' && nextItem.image_url ? (
                        <img src={nextItem.image_url} alt={nextItem.title} className="w-full h-full object-contain" />
                      ) : nextItem.type === 'event' && nextItem.image_url ? (
                        <img src={nextItem.image_url} alt={nextItem.title} className="w-full h-full object-contain" />
                      ) : nextItem.type === 'media' ? (
                        <img src={nextItem.file_url} alt={getItemTitle(nextItem)} className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold bg-gray-100">
                          {getItemTitle(nextItem).slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-amber-600 transition-colors">{getItemTitle(nextItem)}</h4>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                        <span>{getItemLabel(nextItem)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Up Next - Mobile List Item (Matches Queue style) */}
              {nextItem && (
                <div className="lg:hidden p-3 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Up Next</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 ring-1 ring-black/5">
                      {nextItem.type === 'announcement' && nextItem.image_url ? (
                        <img src={nextItem.image_url} alt={nextItem.title} className="w-full h-full object-cover" />
                      ) : nextItem.type === 'event' && nextItem.image_url ? (
                        <img src={nextItem.image_url} alt={nextItem.title} className="w-full h-full object-cover" />
                      ) : nextItem.type === 'media' ? (
                        <img src={nextItem.file_url} alt={getItemTitle(nextItem)} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold bg-white">
                          {getItemTitle(nextItem).slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{getItemTitle(nextItem)}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                        <span className="capitalize">{getItemLabel(nextItem).toLowerCase()}</span>
                        <span>•</span>
                        <span className="font-mono">{getItemDuration(nextItem)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* In Queue */}
              <div className="p-3 lg:p-4">
                <div className="flex items-center justify-between mb-2 lg:mb-3">
                  <h3 className="text-[10px] lg:text-xs font-bold text-gray-400 uppercase tracking-wider">In Queue</h3>
                </div>
                <div className="space-y-1">
                  {Array.from({ length: Math.min(5, allItems.length - 2) }, (_, i) => {
                    const queueIndex = (currentIndex + 2 + i) % allItems.length;
                    const item = allItems[queueIndex];
                    return (
                      <div key={`${item.type}-${item.id}-${queueIndex}`} className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                        <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 ring-1 ring-black/5">
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
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h4 className="text-sm text-gray-700 truncate font-medium group-hover:text-gray-900">{getItemTitle(item)}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <span className="capitalize">{getItemLabel(item).toLowerCase()}</span>
                            <span>•</span>
                            <span className="font-mono">{getItemDuration(item)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Center Panel - Display Preview */}
          {/* On Mobile: Order 1 (Top) */}
          <div className="order-1 lg:order-2 flex-1 bg-black flex items-center justify-center p-4 lg:p-8 relative min-h-[300px] lg:min-h-0">
            {/* Background decorative elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-50 pointer-events-none" />

            <div className="w-full max-w-6xl relative z-10">
              <div className="mb-4 flex items-center justify-between text-white/60 text-sm px-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  <span className="font-medium tracking-wide text-white/90">Main Corridor TV</span>
                  <span className="text-white/20">•</span>
                  <span className="text-green-400 text-xs font-bold uppercase tracking-wider bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Online</span>
                </div>
                <div className="font-mono text-xs opacity-70 bg-white/5 px-2 py-1 rounded-md border border-white/10">{currentIndex + 1} <span className="text-white/30">/</span> {allItems.length}</div>
              </div>

              <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/10 relative group" style={{ aspectRatio: '16/9' }}>
                {/* Background - Matches Display.tsx */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-black to-black w-full h-full" />

                {/* Ambient background blobs - Matches Display.tsx */}
                <div className="pointer-events-none absolute -top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full aurora-blob bg-gradient-to-br from-indigo-500/60 via-fuchsia-500/50 to-rose-500/50" />
                <div className="pointer-events-none absolute -bottom-[20%] -right-[20%] w-[55%] h-[55%] rounded-full aurora-blob bg-gradient-to-tr from-blue-500/50 via-emerald-500/40 to-cyan-500/40" />

                {/* Screen Glare Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"></div>

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
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-4 lg:p-10">
                              <div className="glass elevate soft-shadow p-6 lg:p-8 rounded-2xl max-w-4xl">
                                <div className="mb-4">
                                  <span className="px-3 py-1 rounded-full text-xs tracking-wider bg-white/10 text-white/80">ANNOUNCEMENT</span>
                                </div>
                                <h1 className="text-2xl lg:text-5xl font-semibold leading-tight mb-4 text-white">
                                  {currentItem.title}
                                </h1>
                                <p className="text-base lg:text-xl text-white/80 leading-relaxed max-w-2xl">
                                  {currentItem.body}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-gray-900 to-black">
                            {/* Abstract backgrounds could go here */}
                            <div className="glass elevate soft-shadow text-center max-w-4xl w-full p-8 lg:p-12">
                              <div className="mb-6">
                                <span className="px-4 py-2 rounded-full text-sm tracking-wider bg-white/10 text-white/80">ANNOUNCEMENT</span>
                              </div>
                              <h1 className="text-3xl lg:text-6xl font-semibold leading-tight mb-6 text-white">
                                {currentItem.title}
                              </h1>
                              <p className="text-xl lg:text-2xl text-white/70 leading-relaxed font-light">
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
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-4 lg:p-10">
                              <div className="glass elevate soft-shadow p-6 lg:p-8 rounded-2xl max-w-6xl">
                                <div className="mb-4">
                                  <span className="px-3 py-1 rounded-full text-xs tracking-wider bg-emerald-400/15 text-emerald-200/90">EVENT</span>
                                </div>
                                <h1 className="text-2xl lg:text-5xl font-semibold leading-tight mb-4 text-white">
                                  {currentItem.title}
                                </h1>
                                <p className="text-base lg:text-xl text-white/80 leading-relaxed mb-6">
                                  {currentItem.description}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-white/85">
                                  <div className="glass border-white/10 bg-white/5 rounded-xl p-3 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                      <Calendar className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-[10px] text-white/60">Date</div>
                                      <div className="text-sm font-medium truncate">{new Date(currentItem.start_date).toLocaleDateString()}</div>
                                    </div>
                                  </div>
                                  <div className="glass border-white/10 bg-white/5 rounded-xl p-3 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                      <Clock className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-[10px] text-white/60">Time</div>
                                      <div className="text-sm font-medium truncate">
                                        {new Date(currentItem.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    </div>
                                  </div>
                                  {currentItem.location && (
                                    <div className="glass border-white/10 bg-white/5 rounded-xl p-3 flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                        <MapPin className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-[10px] text-white/60">Location</div>
                                        <div className="text-sm font-medium truncate">{currentItem.location}</div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-4 lg:p-10">
                            <div className="glass elevate soft-shadow text-center max-w-6xl w-full p-4 md:p-6 lg:p-10">
                              <div className="mb-3 lg:mb-4">
                                <span className="px-3 py-1 lg:px-4 lg:py-2 rounded-full text-[10px] lg:text-sm tracking-wider bg-white/10 text-white/80">ANNOUNCEMENT</span>
                              </div>
                              <h1 className="text-xl md:text-3xl lg:text-5xl font-semibold leading-tight mb-3 lg:mb-4 text-white line-clamp-2">
                                {currentItem.title}
                              </h1>
                              <p className="text-sm md:text-lg lg:text-2xl text-white/70 leading-relaxed font-light mb-4 lg:mb-8 line-clamp-3">
                                {currentItem.description}
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
                                <div className="glass bg-white/5 rounded-xl p-4 text-left">
                                  <div className="flex items-center gap-2 mb-1"><Calendar className="w-4 h-4 text-white/80" /><span className="text-xs text-white/70">Date</span></div>
                                  <div className="text-base font-medium">{new Date(currentItem.start_date).toLocaleDateString()}</div>
                                </div>
                                <div className="glass bg-white/5 rounded-xl p-4 text-left">
                                  <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-white/80" /><span className="text-xs text-white/70">Time</span></div>
                                  <div className="text-base font-medium">
                                    {new Date(currentItem.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                                {currentItem.location && (
                                  <div className="glass bg-white/5 rounded-xl p-4 text-left">
                                    <div className="flex items-center gap-2 mb-1"><MapPin className="w-4 h-4 text-white/80" /><span className="text-xs text-white/70">Location</span></div>
                                    <div className="text-base font-medium truncate">{currentItem.location}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      ) : (
                        currentItem.file_type === 'image' ? (
                          <div className="relative w-full h-full bg-black">
                            <img
                              src={currentItem.file_url}
                              alt={currentItem.title || 'Media'}
                              className="w-full h-full object-contain"
                            />
                            {currentItem.description && (
                              <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5">
                                <div className="glass elevate soft-shadow rounded-xl px-4 py-3 bg-black/40">
                                  <div className="text-xs lg:text-sm text-white/70">
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
                              className="w-full h-full object-contain"
                              playsInline
                              autoPlay
                              muted
                              loop={false}
                              onEnded={() => setCurrentIndex((prev) => (prev + 1) % allItems.length)}
                            />
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            {currentItem.description && (
                              <div className="absolute inset-x-0 bottom-0 p-4 lg:p-6">
                                <div className="glass elevate soft-shadow rounded-xl px-4 py-3 bg-black/40 max-w-2xl mx-auto">
                                  <div className="text-xs lg:text-sm text-white/75">{currentItem.description}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/50 bg-gradient-to-br from-slate-900 via-black to-black">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                      <Play className="w-8 h-8 text-white/20 ml-1" />
                    </div>
                    <div className="text-center max-w-sm px-6">
                      <h2 className="text-2xl font-bold mb-2 text-white">No Active Content</h2>
                      <p className="text-white/40 leading-relaxed">Your playlist is empty. Add announcements, events, or media from the admin dashboard to get started.</p>
                      <Button onClick={() => navigate('/admin')} variant="outline" className="mt-6 border-white/10 text-white hover:bg-white/10 hover:text-white">
                        Go to Dashboard
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - TV Actions */}
          {/* On Mobile: Order 2 (Middle, below Preview) */}
          <div className="order-2 lg:order-3 w-full bg-white border-b lg:border-b-0 lg:border-l border-gray-200 flex flex-col shadow-sm z-10">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">TV Control</h2>
            </div>

            <div className="p-4 flex-1">
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                <Button
                  onClick={handleUpdateTV}
                  className="w-full justify-start h-12 lg:h-14 text-left px-4 border-gray-200 hover:border-gray-300 hover:bg-gray-50 group transition-all"
                  variant="outline"
                >
                  <div className="bg-gray-100 p-2 rounded-md mr-3 group-hover:bg-gray-200 transition-colors">
                    <RefreshCw className="w-4 h-4 text-gray-900" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Update TV</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Sync Content</div>
                  </div>
                </Button>

                <Button
                  onClick={handleRestartTV}
                  className="w-full justify-start h-12 lg:h-14 text-left px-4 border-gray-200 hover:border-gray-300 hover:bg-gray-50 group transition-all"
                  variant="outline"
                >
                  <div className="bg-gray-100 p-2 rounded-md mr-3 group-hover:bg-gray-200 transition-colors">
                    <Power className="w-4 h-4 text-gray-900" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Restart TV</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Hard Reset</div>
                  </div>
                </Button>

                {/* Volume Control Dialog */}
                <Dialog open={showVolumeDialog} onOpenChange={setShowVolumeDialog}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full justify-start h-12 lg:h-14 text-left px-4 border-gray-200 hover:border-gray-300 hover:bg-gray-50 group transition-all col-span-2 lg:col-span-1"
                      variant="outline"
                    >
                      <div className="bg-gray-100 p-2 rounded-md mr-3 group-hover:bg-gray-200 transition-colors">
                        {isMuted ? <VolumeX className="w-4 h-4 text-gray-900" /> : <Volume2 className="w-4 h-4 text-gray-900" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Volume Control</div>
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Sound Settings</div>
                          <div className="text-xs font-bold text-gray-900 bg-gray-100 px-1.5 rounded">{volume}%</div>
                        </div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <div className="bg-gray-100 p-2 rounded-lg">
                          <Volume2 className="w-5 h-5 text-gray-900" />
                        </div>
                        Volume Control
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-8 py-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">Master Volume</label>
                          <span className="text-lg font-bold text-gray-900">{volume}%</span>
                        </div>
                        <Slider
                          value={[volume]}
                          onValueChange={(value) => handleVolumeChange(value[0])}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400 font-medium px-1">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isMuted ? 'bg-gray-200 text-gray-600' : 'bg-gray-200 text-gray-900'}`}>
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Mute Audio</div>
                            <div className="text-xs text-gray-500">Temporarily silence displays</div>
                          </div>
                        </div>
                        <Button
                          variant={isMuted ? "destructive" : "outline"}
                          size="sm"
                          onClick={handleMuteToggle}
                          className="min-w-[80px]"
                        >
                          {isMuted ? 'Unmute' : 'Mute'}
                        </Button>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-gray-50 text-gray-600 rounded-lg text-xs leading-relaxed">
                        <div className="mt-0.5 min-w-[16px]">
                          <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold">i</div>
                        </div>
                        Note: Volume changes will apply to the Main Corridor TV display in real-time. There may be a slight delay depending on network conditions.
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 text-center lg:text-left mt-auto">
              <p className="text-xs text-gray-400">System Version 2.0.4</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveDisplay;
