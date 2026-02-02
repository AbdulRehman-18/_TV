import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { supabase } from '@/lib/supabase';
import { Announcement, Event, Media } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Volume2, VolumeX } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useRealtimeSubscription, type ConnectionStatus } from '@/hooks/useRealtimeSubscription';
import { ConnectionIndicator } from '@/components/display/ConnectionIndicator';
import { useScheduler } from '@/hooks/useScheduler';


export function Display() {
  const { settings } = useSettings();
  const { getContentToDisplay } = useScheduler();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [audioEnabled, setAudioEnabled] = useState(() => {
    const saved = localStorage.getItem('display-audio-enabled');
    return saved === 'true';
  });

  // Connection status for realtime subscriptions
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  const toggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    localStorage.setItem('display-audio-enabled', newState.toString());
    // Dispatch event so VideoSlide can react
    window.dispatchEvent(new CustomEvent('audio-toggle', { detail: newState }));
  };

  // Listen for Enter/OK key press from TV remote
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Enter key (OK button on TV remote)
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleAudio();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [audioEnabled]);

  // Volume control state (synced with LiveDisplay via localStorage)
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('display-volume');
    return saved ? parseInt(saved) / 100 : 0.5;
  });
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('display-muted');
    return saved === 'true';
  });
  const videoRef = useRef<HTMLVideoElement>(null);

  // simple throttle using ref to avoid over-fetching
  const lastReloadRef = useRef(0);
  const reloadAllRef = useRef<null | ((reason?: string) => Promise<void>)>(null);

  // Note: Scheduling logic is now handled by useScheduler hook
  if (!reloadAllRef.current) {
    reloadAllRef.current = async (reason?: string) => {
      const now = Date.now();
      if (now - lastReloadRef.current < 1500) {
        return; // throttle
      }
      lastReloadRef.current = now;
      try {
        console.debug('[Display] reloadAll triggered', reason || '');
        await Promise.all([loadAnnouncements(), loadEvents(), loadMedia()]);
      } catch {
        // errors are logged inside loaders
      }
    };
  }

  // Initial data load
  useEffect(() => {
    loadAnnouncements();
    loadEvents();
    loadMedia();
  }, []);

  // Set up robust real-time subscriptions with auto-reconnection
  // These hooks are used for their side effects (subscriptions), not their return values
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const announcementsRealtime = useRealtimeSubscription({
    table: 'announcements',
    onAny: () => {
      console.debug('[Display] Announcements updated via realtime');
      loadAnnouncements();
    },
    onConnectionChange: (status) => {
      setConnectionStatus(status);
      console.debug('[Display] Announcements connection:', status);
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const eventsRealtime = useRealtimeSubscription({
    table: 'events',
    onAny: () => {
      console.debug('[Display] Events updated via realtime');
      loadEvents();
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const mediaRealtime = useRealtimeSubscription({
    table: 'media',
    onAny: () => {
      console.debug('[Display] Media updated via realtime');
      loadMedia();
    },
  });

  // Sync volume with video element and listen for changes from LiveDisplay
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Listen for volume changes from LiveDisplay page via localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'display-volume' && e.newValue) {
        setVolume(parseInt(e.newValue) / 100);
      } else if (e.key === 'display-muted' && e.newValue) {
        setIsMuted(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
          // Hard reload if explicitly requested
          window.location.reload();
        } else {
          // Soft reload: refetch data without page refresh
          reloadAllRef.current?.(reason || 'remote-broadcast');
        }
      })
      .subscribe((status) => {
        console.debug('[Display] control channel status:', status);
      });

    return () => {
      try {
        controlChannel.unsubscribe();
      } catch {
        // ignore
      }
    };
  }, []);

  // BroadcastChannel fallback: listen for changes from admin UI in other tabs
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('tv-updates');
      console.debug('[Display] BroadcastChannel listener attached');
      bc.onmessage = (ev) => {
        const msg = ev.data;
        if (!msg || !msg.channel) return;

        console.debug('[Display] Received bc message:', msg);
        if (msg.channel === 'announcements') {
          console.debug('[Display] Reloading announcements via bc');
          loadAnnouncements();
        } else if (msg.channel === 'events') {
          console.debug('[Display] Reloading events via bc');
          loadEvents();
        } else if (msg.channel === 'media') {
          console.debug('[Display] Reloading media via bc');
          loadMedia();
        }
      };
    } catch {
      // BroadcastChannel not available; ignore
    }

    return () => {
      try {
        bc?.close();
      } catch {
        // ignore
      }
    };
  }, []);

  // Network resilience: poll periodically and refetch on focus/visibility/online
  useEffect(() => {
    // Polling every 20s as a watchdog for cross-device updates
    const interval = setInterval(() => reloadAllRef.current?.('poll'), 20000);

    const onFocus = () => reloadAllRef.current?.('window-focus');
    const onVisible = () => {
      if (document.visibilityState === 'visible') reloadAllRef.current?.('visibility');
    };
    const onOnline = () => reloadAllRef.current?.('online');

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  // Clock update
  useEffect(() => {
    if (!settings.showDateTimeOnDisplay) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [settings.showDateTimeOnDisplay]);

  // Sync currentIndex to localStorage for LiveDisplay preview
  useEffect(() => {
    localStorage.setItem('display-current-index', currentIndex.toString());
  }, [currentIndex]);


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


  // Use ref to avoid stale closure in video onEnded callback
  const totalItemsRef = useRef(allItems.length);
  totalItemsRef.current = allItems.length;

  const currentItem: SlideItem = allItems[currentIndex];

  // Slideshow timer logic: pause for video, use settings interval for others
  useEffect(() => {
    if (allItems.length === 0) return;

    // Determine if current slide is a video
    const currentItem = allItems[currentIndex];

    // If current slide is a video, do not auto-advance
    if (currentItem && currentItem.type === 'media' && currentItem.file_type === 'video') {
      // Do nothing: video will advance onEnded
      return;
    }

    // Otherwise, auto-advance based on settings
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalItemsRef.current);
    }, settings.slideshowInterval * 1000);
    return () => clearInterval(timer);
  }, [allItems, currentIndex, settings.slideshowInterval]);


  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-slate-900 via-black to-black text-white flex items-center justify-center">
        {/* Aurora background */}
        <div className="pointer-events-none absolute -top-20 -left-20 w-[55vw] h-[55vw] rounded-full aurora-blob bg-gradient-to-br from-indigo-500/60 via-fuchsia-500/50 to-rose-500/50" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-[50vw] h-[50vw] rounded-full aurora-blob bg-gradient-to-tr from-blue-500/50 via-emerald-500/40 to-cyan-500/40" />

        <div className="glass elevate px-10 py-8 text-center soft-shadow">
          <div className="mx-auto mb-5 h-16 w-16 rounded-full border-4 border-white/20 border-t-white/80 animate-spin" />
          <p className="text-xl tracking-wide text-white/90">Loading content…</p>
        </div>
      </div>
    );
  }

  if (allItems.length === 0) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-slate-900 via-black to-black text-white flex items-center justify-center px-8">
        {/* Aurora background */}
        <div className="pointer-events-none absolute -top-20 -left-20 w-[55vw] h-[55vw] rounded-full aurora-blob bg-gradient-to-br from-indigo-500/60 via-fuchsia-500/50 to-rose-500/50" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-[50vw] h-[50vw] rounded-full aurora-blob bg-gradient-to-tr from-blue-500/50 via-emerald-500/40 to-cyan-500/40" />

        <div className="glass elevate max-w-4xl w-full mx-auto px-10 py-12 text-center soft-shadow">
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-5">Smart Corridor Display</h1>
          <p className="text-2xl text-white/70">No active content to display</p>
        </div>
      </div>
    );
  }

  const slideDurationMs = settings.slideshowInterval * 1000;
  const progressStyle: CSSProperties & Record<'--duration', string> = { ['--duration']: `${slideDurationMs}ms` };

  // Determine if current slide is a video
  const isCurrentSlideVideo = allItems[currentIndex]?.type === 'media' && allItems[currentIndex]?.file_type === 'video';

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-slate-900 via-black to-black text-white">
      {/* Ambient background */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-[60vw] h-[60vw] rounded-full aurora-blob bg-gradient-to-br from-indigo-500/60 via-fuchsia-500/50 to-rose-500/50" />
      <div className="pointer-events-none absolute -bottom-28 -right-28 w-[55vw] h-[55vw] rounded-full aurora-blob bg-gradient-to-tr from-blue-500/50 via-emerald-500/40 to-cyan-500/40" />

      {/* Date/Time Overlay */}
      {settings.showDateTimeOnDisplay && (
        <div className="fixed top-6 right-6 z-50 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-lg">
          <div className="text-white text-right">
            <div className="text-2xl font-semibold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="text-sm opacity-80">{currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</div>
          </div>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentItem.type}-${currentItem.id}`}
          initial={
            !settings.enableTransitions || settings.transitionEffect === 'none'
              ? {}
              : settings.transitionEffect === 'fade'
                ? { opacity: 0 }
                : settings.transitionEffect === 'slide'
                  ? { opacity: 0, x: 100 }
                  : settings.transitionEffect === 'zoom'
                    ? { opacity: 0, scale: 0.8 }
                    : {}
          }
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={
            !settings.enableTransitions || settings.transitionEffect === 'none'
              ? {}
              : settings.transitionEffect === 'fade'
                ? { opacity: 0 }
                : settings.transitionEffect === 'slide'
                  ? { opacity: 0, x: -100 }
                  : settings.transitionEffect === 'zoom'
                    ? { opacity: 0, scale: 1.2 }
                    : {}
          }
          transition={
            !settings.enableTransitions || settings.transitionEffect === 'none'
              ? { duration: 0 }
              : { duration: 0.5, ease: 'easeInOut' }
          }
          className="relative min-h-screen"
        >
          {currentItem.type === 'announcement' ? (
            (currentItem as Announcement & { type: 'announcement' }).image_url ? (
              <div className="relative min-h-screen">
                <img
                  src={(currentItem as Announcement & { type: 'announcement' }).image_url!}
                  alt={(currentItem as Announcement & { type: 'announcement' }).title}
                  className="w-full h-screen object-contain edge-fade"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-8 md:p-12 lg:p-16">
                  <div className="glass elevate soft-shadow p-6 md:p-8 rounded-2xl max-w-5xl">
                    <div className="mb-4">
                      <span className="px-3 py-1 rounded-full text-xs tracking-wider bg-white/10 text-white/80">ANNOUNCEMENT</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight mb-4">
                      {(currentItem as Announcement & { type: 'announcement' }).title}
                    </h1>
                    <p className="text-lg md:text-xl lg:text-2xl text-white/80 leading-relaxed">
                      {(currentItem as Announcement & { type: 'announcement' }).body}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="min-h-screen flex items-center justify-center px-6 md:px-10">
                <div className="glass elevate soft-shadow text-center max-w-5xl w-full p-8 md:p-12">
                  <div className="mb-6">
                    <span className="px-4 py-2 rounded-full text-sm tracking-wider bg-white/10 text-white/80">ANNOUNCEMENT</span>
                  </div>
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-tight mb-6">
                    {(currentItem as Announcement & { type: 'announcement' }).title}
                  </h1>
                  <p className="text-2xl md:text-3xl text-white/70 leading-relaxed font-light">
                    {(currentItem as Announcement & { type: 'announcement' }).body}
                  </p>
                </div>
              </div>
            )
          ) : currentItem.type === 'event' ? (
            (currentItem as Event & { type: 'event' }).image_url ? (
              <div className="relative min-h-screen">
                <img
                  src={(currentItem as Event & { type: 'event' }).image_url!}
                  alt={(currentItem as Event & { type: 'event' }).title}
                  className="w-full h-screen object-contain edge-fade"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-8 md:p-12 lg:p-16">
                  <div className="glass elevate soft-shadow p-6 md:p-8 rounded-2xl max-w-6xl">
                    <div className="mb-4">
                      <span className="px-3 py-1 rounded-full text-xs tracking-wider bg-emerald-400/15 text-emerald-200/90">EVENT</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight mb-4">
                      {(currentItem as Event & { type: 'event' }).title}
                    </h1>
                    <p className="text-lg md:text-xl lg:text-2xl text-white/80 leading-relaxed mb-6">
                      {(currentItem as Event & { type: 'event' }).description}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white/85">
                      <div className="glass border-white/10 bg-white/5 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-white/60">Date</div>
                          <div className="text-lg font-medium">{new Date((currentItem as Event & { type: 'event' }).start_date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="glass border-white/10 bg-white/5 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs text-white/60">Time</div>
                          <div className="text-lg font-medium">
                            {new Date((currentItem as Event & { type: 'event' }).start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {(currentItem as Event & { type: 'event' }).end_date && ` - ${new Date((currentItem as Event & { type: 'event' }).end_date!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          </div>
                        </div>
                      </div>
                      {(currentItem as Event & { type: 'event' }).location && (
                        <div className="glass border-white/10 bg-white/5 rounded-xl p-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs text-white/60">Location</div>
                            <div className="text-lg font-medium">{(currentItem as Event & { type: 'event' }).location}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="min-h-screen flex items-center justify-center px-6 md:px-10">
                <div className="glass elevate soft-shadow text-center max-w-6xl w-full p-8 md:p-12">
                  <div className="mb-6">
                    <span className="px-4 py-2 rounded-full text-sm tracking-wider bg-emerald-400/15 text-emerald-200/90">EVENT</span>
                  </div>
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-tight mb-6">
                    {(currentItem as Event & { type: 'event' }).title}
                  </h1>
                  <p className="text-2xl md:text-3xl text-white/70 leading-relaxed font-light mb-10">
                    {(currentItem as Event & { type: 'event' }).description}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <div className="glass bg-white/5 rounded-xl p-6 text-left">
                      <div className="flex items-center gap-3 mb-2"><Calendar className="w-5 h-5 text-white/80" /><span className="text-white/70">Date</span></div>
                      <div className="text-xl font-medium">{new Date((currentItem as Event & { type: 'event' }).start_date).toLocaleDateString()}</div>
                    </div>
                    <div className="glass bg-white/5 rounded-xl p-6 text-left">
                      <div className="flex items-center gap-3 mb-2"><Clock className="w-5 h-5 text-white/80" /><span className="text-white/70">Time</span></div>
                      <div className="text-xl font-medium">
                        {new Date((currentItem as Event & { type: 'event' }).start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {(currentItem as Event & { type: 'event' }).end_date && ` - ${new Date((currentItem as Event & { type: 'event' }).end_date!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </div>
                    </div>
                    {(currentItem as Event & { type: 'event' }).location && (
                      <div className="glass bg-white/5 rounded-xl p-6 text-left">
                        <div className="flex items-center gap-3 mb-2"><MapPin className="w-5 h-5 text-white/80" /><span className="text-white/70">Location</span></div>
                        <div className="text-xl font-medium">{(currentItem as Event & { type: 'event' }).location}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          ) : (
            // Media
            (currentItem as Media & { type: 'media' }).file_type === 'image' ? (
              <div className="min-h-screen relative bg-black">
                <img
                  src={(currentItem as Media & { type: 'media' }).file_url}
                  alt={(currentItem as Media & { type: 'media' }).title || 'Media'}
                  className="w-full h-screen object-contain"
                />
                {(currentItem as Media & { type: 'media' }).description && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                    <div className="glass elevate soft-shadow rounded-xl px-4 py-3 md:px-5 md:py-4 bg-black/40">
                      <div className="text-xs md:text-sm text-white/70">
                        {(currentItem as Media & { type: 'media' }).description}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="min-h-screen relative bg-black">
                <VideoSlide
                  src={(currentItem as Media & { type: 'media' }).file_url}
                  onEnded={() => setCurrentIndex((prev) => (prev + 1) % totalItemsRef.current)}
                  description={(currentItem as Media & { type: 'media' }).description}
                />
              </div>
            )
          )}

          {/* Slideshow indicators */}
          {allItems.length > 1 && (
            <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex gap-2">
              {allItems.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-6 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                />
              ))}
            </div>
          )}

          {/* Auto-advance progress bar - only show for non-video slides */}
          {!isCurrentSlideVideo && (
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/10 overflow-hidden">
              <div
                key={currentIndex}
                className="h-full bg-white/90 animate-progress"
                style={progressStyle}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Audio toggle button - works with TV remote (OK/Enter key) or click */}
      <button
        onClick={toggleAudio}
        className={`fixed bottom-8 right-8 z-50 p-4 rounded-full glass transition-all duration-300 hover:scale-105 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-white/50 ${audioEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/20 text-white/50 hover:bg-black/40'
          }`}
        aria-label={audioEnabled ? 'Mute' : 'Unmute'}
      >
        {audioEnabled ? (
          <Volume2 className="w-6 h-6" />
        ) : (
          <VolumeX className="w-6 h-6" />
        )}
      </button>

      {/* Connection status indicator */}
      <ConnectionIndicator status={connectionStatus} position="top-left" autoHideDelay={3000} />
    </div>
  );
}

export default Display;

// VideoSlide component: plays video with audio, advances on end
type VideoSlideProps = {
  src: string;
  onEnded: () => void;
  description?: string;
};
function VideoSlide({ src, onEnded, description }: VideoSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [audioEnabled, setAudioEnabled] = useState(() => {
    const saved = localStorage.getItem('display-audio-enabled');
    return saved === 'true';
  });

  // Listen for audio toggle events
  useEffect(() => {
    const handleAudioToggle = (e: CustomEvent) => {
      setAudioEnabled(e.detail);
    };

    window.addEventListener('audio-toggle', handleAudioToggle as EventListener);
    return () => window.removeEventListener('audio-toggle', handleAudioToggle as EventListener);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = async () => {
      try {
        // Set audio based on user preference
        video.muted = !audioEnabled;
        video.volume = audioEnabled ? 1.0 : 0;
        video.currentTime = 0;
        await video.play();
        console.log(`Playing video with audio: ${audioEnabled ? 'ON' : 'OFF'}`);
      } catch (err) {
        console.warn('Autoplay failed, trying muted:', err);
        try {
          // Fallback: play muted (will always succeed)
          video.muted = true;
          await video.play();
          console.log('Playing video muted due to browser autoplay policy');
        } catch (mutedErr) {
          console.error('Failed to play video even when muted:', mutedErr);
        }
      }
    };

    // Small delay to ensure video element is ready
    const playTimeout = setTimeout(tryPlay, 100);

    return () => {
      clearTimeout(playTimeout);
      if (video) {
        try {
          video.pause();
        } catch (e) {
          // ignore
        }
        try {
          video.currentTime = 0;
        } catch (e) {
          // ignore
        }
      }
    };
  }, [src, audioEnabled]);

  // Update video element when audio setting changes
  useEffect(() => {
    const video = videoRef.current;
    if (video && !video.paused) {
      video.muted = !audioEnabled;
      video.volume = audioEnabled ? 1.0 : 0;
    }
  }, [audioEnabled]);

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-screen object-contain"
        playsInline
        preload="auto"
        onEnded={onEnded}
        controls={false}
      />
      {/* Videos attempt to play with audio first. If browser blocks due to autoplay policy,
          we fallback to muted playback which will always work. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      {description && (
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
          <div className="glass elevate soft-shadow rounded-2xl px-5 py-4 md:px-6 md:py-5 bg-black/40 max-w-4xl">
            <div className="text-sm md:text-base text-white/75">{description}</div>
          </div>
        </div>
      )}
    </>
  );
}