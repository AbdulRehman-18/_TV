import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { supabase } from '@/lib/supabase';
import { Announcement, Event, Media } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Clock, MapPin } from 'lucide-react';

export function Display() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  // simple throttle using ref to avoid over-fetching
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
        console.debug('[Display] reloadAll triggered', reason || '');
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

  // Slideshow timer logic: pause for video, 12s for others
  useEffect(() => {
    const activeAnnouncements = announcements.filter(a => a.is_active);
    const activeEvents = events.filter(e => e.is_active);
    const activeMedia = media.filter(m => m.is_active);
    const totalItems = activeAnnouncements.length + activeEvents.length + activeMedia.length;
    if (totalItems === 0) return;

    // Determine if current slide is a video
    const allItems = [
      ...activeAnnouncements.map(item => ({ ...item, type: 'announcement' as const })),
      ...activeEvents.map(item => ({ ...item, type: 'event' as const })),
      ...activeMedia.map(item => ({ ...item, type: 'media' as const }))
    ];
    const currentItem = allItems[currentIndex];

    // If current slide is a video, do not auto-advance
    if (currentItem && currentItem.type === 'media' && currentItem.file_type === 'video') {
      // Do nothing: video will advance onEnded
      return;
    }

    // Otherwise, auto-advance every 12s
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
  
  // Combine announcements, events, and media into a single array for slideshow
  type SlideItem = (Announcement & { type: 'announcement' }) | (Event & { type: 'event' }) | (Media & { type: 'media' });
  const allItems: SlideItem[] = [
    ...activeAnnouncements.map(item => ({ ...item, type: 'announcement' as const })),
    ...activeEvents.map(item => ({ ...item, type: 'event' as const })),
    ...activeMedia.map(item => ({ ...item, type: 'media' as const }))
  ];

  // Use ref to avoid stale closure in video onEnded callback
  const totalItemsRef = useRef(allItems.length);
  totalItemsRef.current = allItems.length;
  
  const currentItem: SlideItem = allItems[currentIndex];

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

  const slideDurationMs = 12000;
  const progressStyle: CSSProperties & Record<'--duration', string> = { ['--duration']: `${slideDurationMs}ms` };

  // Determine if current slide is a video
  const isCurrentSlideVideo = allItems[currentIndex]?.type === 'media' && allItems[currentIndex]?.file_type === 'video';

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-slate-900 via-black to-black text-white">
      {/* Ambient background */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-[60vw] h-[60vw] rounded-full aurora-blob bg-gradient-to-br from-indigo-500/60 via-fuchsia-500/50 to-rose-500/50" />
      <div className="pointer-events-none absolute -bottom-28 -right-28 w-[55vw] h-[55vw] rounded-full aurora-blob bg-gradient-to-tr from-blue-500/50 via-emerald-500/40 to-cyan-500/40" />

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentItem.type}-${currentItem.id}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative min-h-screen"
        >
          {currentItem.type === 'announcement' ? (
            (currentItem as Announcement & { type: 'announcement' }).image_url ? (
              <div className="relative min-h-screen">
                <img
                  src={(currentItem as Announcement & { type: 'announcement' }).image_url!}
                  alt={(currentItem as Announcement & { type: 'announcement' }).title}
                  className="w-full h-screen object-cover edge-fade"
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
                  className="w-full h-screen object-cover edge-fade"
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
                            {new Date((currentItem as Event & { type: 'event' }).start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            {(currentItem as Event & { type: 'event' }).end_date && ` - ${new Date((currentItem as Event & { type: 'event' }).end_date!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
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
                        {new Date((currentItem as Event & { type: 'event' }).start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        {(currentItem as Event & { type: 'event' }).end_date && ` - ${new Date((currentItem as Event & { type: 'event' }).end_date!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
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
              <div className="min-h-screen flex items-center justify-center bg-black px-6 md:px-10">
                <div className="relative max-w-[92vw] max-h-[88vh] w-full h-full flex items-center justify-center">
                  <div className="absolute inset-6 -z-10 rounded-3xl bg-gradient-to-tr from-white/10 to-white/0 blur-2xl" />
                  <div className="relative rounded-3xl overflow-hidden soft-shadow" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}>
                    <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)' }} />
                    <img
                      src={(currentItem as Media & { type: 'media' }).file_url}
                      alt={(currentItem as Media & { type: 'media' }).title}
                      className="object-contain max-h-[88vh] max-w-[92vw] bg-neutral-900"
                    />
                    {((currentItem as Media & { type: 'media' }).title || (currentItem as Media & { type: 'media' }).description) && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                        <div className="glass elevate soft-shadow rounded-xl px-4 py-3 md:px-5 md:py-4 bg-black/40">
                          {(currentItem as Media & { type: 'media' }).title && (
                            <div className="text-base md:text-lg font-medium">
                              {(currentItem as Media & { type: 'media' }).title}
                            </div>
                          )}
                          {(currentItem as Media & { type: 'media' }).description && (
                            <div className="text-xs md:text-sm text-white/70 mt-0.5">
                              {(currentItem as Media & { type: 'media' }).description}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
                  className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                    index === currentIndex ? 'bg-white' : 'bg-white/40'
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
  const [needsUnmute, setNeedsUnmute] = useState(false);
  const [mutedFallback, setMutedFallback] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let mounted = true;

    const tryPlay = async () => {
      try {
        // Try to play with audio first
        video.muted = false;
        video.currentTime = 0;
        await video.play();
        if (!mounted) return;
        setNeedsUnmute(false);
        setMutedFallback(false);
      } catch (err) {
        // Browser blocked unmuted autoplay — try muted autoplay so video still plays
        console.warn('Unmuted autoplay blocked, falling back to muted autoplay', err);
        try {
          video.muted = true;
          setMutedFallback(true);
          await video.play();
          if (!mounted) return;
          // Show unmute affordance so user can enable audio with a gesture
          setNeedsUnmute(true);
        } catch (err2) {
          console.error('Muted autoplay also failed', err2);
          // Final fallback: mark as needing unmute so user can start playback
          setNeedsUnmute(true);
        }
      }
    };

    tryPlay();

    return () => {
      mounted = false;
      if (video) {
        try {
          video.pause();
        } catch (e) {
          console.warn('Error pausing video on cleanup', e);
        }
        try {
          video.currentTime = 0;
        } catch (e) {
          console.warn('Error resetting video time on cleanup', e);
        }
      }
    };
  }, [src]);

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-screen object-cover"
        autoPlay
        playsInline
        preload="auto"
        muted={mutedFallback}
        onEnded={onEnded}
        controls={false}
      />
      {/* Unmute overlay shown when autoplay was only allowed muted — user must gesture to enable audio */}
      {needsUnmute && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
          <button
            onClick={async () => {
              const v = videoRef.current;
              if (!v) return;
              try {
                v.muted = false;
                await v.play();
                setNeedsUnmute(false);
                setMutedFallback(false);
              } catch (err) {
                console.error('Failed to unmute video on user gesture', err);
              }
            }}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full glass elevate"
            aria-label="Enable sound"
          >
            Enable sound
          </button>
        </div>
      )}
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