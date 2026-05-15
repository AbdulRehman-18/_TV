import { useState, useEffect, useRef, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { api } from '@/lib/api';
import type { ActiveScheduleResponse, Announcement, Event, Media } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Megaphone, Clapperboard } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { ConnectionIndicator } from '@/components/display/ConnectionIndicator';

type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';
import { useScheduler } from '@/hooks/useScheduler';

const RELOAD_THROTTLE_MS = 1500;
const POLL_INTERVAL_MS = 20000;

// ─── Slide type helper ────────────────────────────────────────────────────────
type SlideItem =
  | (Announcement & { type: 'announcement' })
  | (Event & { type: 'event' })
  | (Media & { type: 'media' });

// ─── Minimal ticker-style date/time ──────────────────────────────────────────
function Clock24({ time }: { time: Date }) {
  return (
    <div className="flex flex-col items-end leading-none">
      <span className="text-3xl font-light tabular-nums tracking-tight text-white">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
      <span className="text-xs text-white/50 mt-0.5 tracking-widest uppercase">
        {time.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
      </span>
    </div>
  );
}

// ─── Slide progress dots ──────────────────────────────────────────────────────
function SlideDots({ total, current }: { total: number; current: number }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-500 ${
            i === current
              ? 'w-6 h-1.5 bg-white'
              : 'w-1.5 h-1.5 bg-white/30'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Type badge ───────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: 'announcement' | 'event' | 'media' }) {
  const config = {
    announcement: {
      label: 'Announcement',
      icon: <Megaphone className="w-3 h-3" />,
      color: 'bg-violet-500/20 text-violet-200 border-violet-500/30',
    },
    event: {
      label: 'Event',
      icon: <Calendar className="w-3 h-3" />,
      color: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
    },
    media: {
      label: 'Media',
      icon: <Clapperboard className="w-3 h-3" />,
      color: 'bg-sky-500/20 text-sky-200 border-sky-500/30',
    },
  }[type];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border tracking-wide ${config.color}`}>
      {config.icon}
      {config.label.toUpperCase()}
    </span>
  );
}

// ─── Announcement slide ───────────────────────────────────────────────────────
function AnnouncementSlide({ item }: { item: Announcement & { type: 'announcement' } }) {
  if (item.image_url) {
    return (
      <div className="relative w-full h-screen">
        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-16 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <TypeBadge type="announcement" />
            <h1 className="mt-4 text-6xl lg:text-7xl font-bold leading-tight text-white drop-shadow-2xl max-w-4xl">
              {item.title}
            </h1>
            {item.body && (
              <p className="mt-4 text-2xl text-white/75 leading-relaxed max-w-3xl font-light">
                {item.body}
              </p>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex items-center justify-center px-16 relative">
      {/* Decorative accent */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-fuchsia-600/20 blur-3xl pointer-events-none" />

      <motion.div
        className="relative z-10 max-w-5xl w-full text-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <TypeBadge type="announcement" />

        {/* Decorative line */}
        <div className="mx-auto mt-8 mb-8 w-16 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent" />

        <h1 className="text-7xl lg:text-8xl font-bold leading-tight text-white tracking-tight">
          {item.title}
        </h1>

        {item.body && (
          <p className="mt-8 text-2xl lg:text-3xl text-white/60 leading-relaxed font-light max-w-4xl mx-auto">
            {item.body}
          </p>
        )}
      </motion.div>
    </div>
  );
}

// ─── Event slide ──────────────────────────────────────────────────────────────
function EventSlide({ item }: { item: Event & { type: 'event' } }) {
  const startDate = new Date(item.start_date);
  const endDate = item.end_date ? new Date(item.end_date) : null;

  const dateStr = startDate.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
  const timeStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTimeStr = endDate ? endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

  if (item.image_url) {
    return (
      <div className="relative w-full h-screen">
        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-y-0 left-0 flex flex-col justify-center px-16 max-w-3xl">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
            <TypeBadge type="event" />
            <h1 className="mt-5 text-6xl lg:text-7xl font-bold leading-tight text-white">
              {item.title}
            </h1>
            {item.description && (
              <p className="mt-4 text-xl text-white/70 leading-relaxed font-light max-w-2xl">
                {item.description}
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span className="text-white text-sm font-medium">{dateStr}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span className="text-white text-sm font-medium">{timeStr}{endTimeStr && ` — ${endTimeStr}`}</span>
              </div>
              {item.location && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span className="text-white text-sm font-medium">{item.location}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex items-center justify-center px-16 relative">
      <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -left-24 w-80 h-80 rounded-full bg-teal-600/15 blur-3xl pointer-events-none" />

      <motion.div
        className="relative z-10 w-full max-w-6xl"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <TypeBadge type="event" />

        <h1 className="mt-6 text-7xl lg:text-8xl font-bold leading-tight text-white tracking-tight max-w-5xl">
          {item.title}
        </h1>

        {item.description && (
          <p className="mt-5 text-2xl text-white/55 leading-relaxed font-light max-w-4xl">
            {item.description}
          </p>
        )}

        {/* Info row */}
        <div className="mt-10 flex flex-wrap gap-5">
          <div className="flex items-center gap-3 border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl px-6 py-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs text-white/40 uppercase tracking-widest mb-0.5">Date</div>
              <div className="text-lg font-semibold text-white">{dateStr}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl px-6 py-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs text-white/40 uppercase tracking-widest mb-0.5">Time</div>
              <div className="text-lg font-semibold text-white">{timeStr}{endTimeStr && ` — ${endTimeStr}`}</div>
            </div>
          </div>

          {item.location && (
            <div className="flex items-center gap-3 border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl px-6 py-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs text-white/40 uppercase tracking-widest mb-0.5">Location</div>
                <div className="text-lg font-semibold text-white">{item.location}</div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Media slide ──────────────────────────────────────────────────────────────
function MediaSlide({ item, onVideoEnded }: { item: Media & { type: 'media' }; onVideoEnded: () => void }) {
  if (item.file_type === 'image') {
    return (
      <div className="relative w-full h-screen bg-black">
        <img src={item.file_url} alt={item.title || 'Media'} className="w-full h-full object-contain" />
        {item.description && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 max-w-2xl w-full px-6">
            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 text-center">
              <p className="text-white/75 text-sm">{item.description}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black">
      <VideoSlide src={item.file_url} onEnded={onVideoEnded} description={item.description} />
    </div>
  );
}

// ─── Main Display ─────────────────────────────────────────────────────────────
export function Display() {
  const { settings } = useSettings();
  const { getContentToDisplay } = useScheduler();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [audioEnabled, setAudioEnabled] = useState(() => localStorage.getItem('display-audio-enabled') === 'true');
  const [connectionStatus] = useState<ConnectionStatus>('connected');

  const toggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    localStorage.setItem('display-audio-enabled', next.toString());
    window.dispatchEvent(new CustomEvent('audio-toggle', { detail: next }));
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleAudio(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [audioEnabled]);

  const lastReloadRef = useRef(0);
  const reloadAllRef = useRef<null | ((reason?: string) => Promise<void>)>(null);

  if (!reloadAllRef.current) {
    reloadAllRef.current = async (reason?: string) => {
      const now = Date.now();
      if (now - lastReloadRef.current < RELOAD_THROTTLE_MS) return;
      lastReloadRef.current = now;
      try { await loadActiveSchedule(); } catch { /* logged inside */ }
    };
  }

  useEffect(() => { loadActiveSchedule(); }, []);

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('tv-updates');
      bc.onmessage = (ev) => {
        const msg = ev.data;
        if (!msg?.channel) return;
        if (msg.channel === 'reload') {
          msg.payload?.hard ? window.location.reload() : reloadAllRef.current?.(msg.payload?.reason);
        } else if (['announcements', 'events', 'media'].includes(msg.channel)) {
          loadActiveSchedule();
        } else if (msg.channel === 'set-index') {
          const idx = msg.payload?.index;
          if (typeof idx === 'number' && idx !== currentIndex) setCurrentIndex(idx);
        }
      };
    } catch {
      console.warn('[Display] BroadcastChannel not available in this browser');
    }
    return () => { try { bc?.close(); } catch { /* ignore */ } };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => reloadAllRef.current?.('poll'), POLL_INTERVAL_MS);
    const onFocus = () => reloadAllRef.current?.('window-focus');
    const onVisible = () => { if (document.visibilityState === 'visible') reloadAllRef.current?.('visibility'); };
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

  useEffect(() => {
    if (!settings.showDateTimeOnDisplay) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [settings.showDateTimeOnDisplay]);

  useEffect(() => {
    localStorage.setItem('display-current-index', currentIndex.toString());
    window.dispatchEvent(new StorageEvent('storage', { key: 'display-current-index', newValue: currentIndex.toString() }));
    try {
      const bc = new BroadcastChannel('tv-updates');
      bc.postMessage({ channel: 'set-index', payload: { index: currentIndex, source: 'display' } });
      bc.close();
    } catch { /* ignore */ }
  }, [currentIndex]);

  const loadActiveSchedule = async () => {
    try {
      const data = await api.get('/schedule/active/') as ActiveScheduleResponse;
      setAnnouncements(data.announcements || []);
      setEvents(data.events || []);
      setMedia([...(data.media || []), ...(data.fallback_media || [])]);
    } catch (error) {
      console.error('Error loading active schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const scheduledContent = useMemo(() => {
    const { items } = getContentToDisplay(announcements, events, media);
    return items;
  }, [announcements, events, media, getContentToDisplay]);

  const filteredContent = useMemo(() => {
    return scheduledContent.filter(item => {
      if ('body' in item) return settings.showAnnouncementsOnDisplay;
      if ('location' in item) return settings.showEventsOnDisplay;
      if ('file_url' in item) return settings.showMediaOnDisplay;
      return true;
    });
  }, [scheduledContent, settings]);

  const allItems: SlideItem[] = useMemo(() => {
    return filteredContent.map(item => {
      if ('body' in item) return { ...item as Announcement, type: 'announcement' as const };
      if ('location' in item) return { ...item as Event, type: 'event' as const };
      return { ...item as Media, type: 'media' as const };
    });
  }, [filteredContent]);

  const totalItemsRef = useRef(allItems.length);
  totalItemsRef.current = allItems.length;

  const currentItem: SlideItem = allItems[currentIndex];
  const isVideo = currentItem?.type === 'media' && (currentItem as Media).file_type === 'video';

  useEffect(() => {
    if (allItems.length === 0 || isVideo) return;
    const duration = ((currentItem as any)?.duration || settings.slideshowInterval) * 1000;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % totalItemsRef.current);
    }, duration);
    return () => clearInterval(timer);
  }, [allItems, currentIndex, settings.slideshowInterval]);

  const slideDurationMs = settings.slideshowInterval * 1000;
  const progressStyle: CSSProperties & Record<string, string> = { '--duration': `${slideDurationMs}ms` };

  const transitionProps = useMemo(() => {
    if (!settings.enableTransitions || settings.transitionEffect === 'none') {
      return { initial: {}, animate: { opacity: 1, x: 0, scale: 1 }, exit: {}, transition: { duration: 0 } };
    }
    const effect = settings.transitionEffect;
    return {
      initial: effect === 'fade' ? { opacity: 0 } : effect === 'slide' ? { opacity: 0, x: 80 } : { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, x: 0, scale: 1 },
      exit: effect === 'fade' ? { opacity: 0 } : effect === 'slide' ? { opacity: 0, x: -80 } : { opacity: 0, scale: 1.05 },
      transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
    };
  }, [settings.enableTransitions, settings.transitionEffect]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-white/5" />
            <div className="absolute inset-0 rounded-full border-2 border-t-white/70 animate-spin" />
          </div>
          <p className="text-white/40 text-sm tracking-widest uppercase">Loading content</p>
        </div>
      </div>
    );
  }

  // ── Empty ──
  if (allItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.08)_0%,_transparent_70%)]" />
        <div className="relative z-10 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8">
            <Clapperboard className="w-7 h-7 text-white/30" />
          </div>
          <h1 className="text-4xl font-semibold text-white/80 tracking-tight">Smart Corridor Display</h1>
          <p className="text-white/30 text-lg">No active content scheduled</p>
        </div>
      </div>
    );
  }

  // ── Main display ──
  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-hidden relative">

      {/* Top bar — always visible */}
      <div className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-10 pt-6 pointer-events-none">

        {/* Left: branding / institution name */}
        <motion.div
          key={`brand-${currentIndex}`}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
            <div className="w-3 h-3 rounded-sm bg-white/80" />
          </div>
          <span className="text-white/50 text-sm tracking-widest uppercase font-light">
            Corridor Display
          </span>
        </motion.div>

        {/* Right: clock */}
        {settings.showDateTimeOnDisplay && <Clock24 time={currentTime} />}
      </div>

      {/* Slide content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentItem.type}-${currentItem.id}`}
          {...transitionProps}
          className="relative min-h-screen"
        >
          {currentItem.type === 'announcement' && (
            <AnnouncementSlide item={currentItem as Announcement & { type: 'announcement' }} />
          )}
          {currentItem.type === 'event' && (
            <EventSlide item={currentItem as Event & { type: 'event' }} />
          )}
          {currentItem.type === 'media' && (
            <MediaSlide
              item={currentItem as Media & { type: 'media' }}
              onVideoEnded={() => setCurrentIndex(prev => (prev + 1) % totalItemsRef.current)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom bar */}
      <div className="absolute bottom-0 inset-x-0 z-50 flex items-center justify-between px-10 pb-6 pointer-events-none">

        {/* Slide dots */}
        <SlideDots total={allItems.length} current={currentIndex} />

        {/* Slide counter */}
        <span className="text-white/25 text-xs tabular-nums tracking-widest">
          {String(currentIndex + 1).padStart(2, '0')} / {String(allItems.length).padStart(2, '0')}
        </span>
      </div>

      {/* Progress bar */}
      {!isVideo && (
        <div className="absolute bottom-0 inset-x-0 z-50 h-0.5 bg-white/5">
          <div
            key={currentIndex}
            className="h-full bg-white/40 animate-progress"
            style={progressStyle}
          />
        </div>
      )}

      {/* Connection indicator */}
      <ConnectionIndicator status={connectionStatus} position="top-left" autoHideDelay={3000} />
    </div>
  );
}

export default Display;

// ─── VideoSlide ───────────────────────────────────────────────────────────────
type VideoSlideProps = { src: string; onEnded: () => void; description?: string };

function VideoSlide({ src, onEnded, description }: VideoSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [audioEnabled, setAudioEnabled] = useState(() => localStorage.getItem('display-audio-enabled') === 'true');

  useEffect(() => {
    const handler = (e: CustomEvent) => setAudioEnabled(e.detail);
    window.addEventListener('audio-toggle', handler as EventListener);
    return () => window.removeEventListener('audio-toggle', handler as EventListener);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const tryPlay = async () => {
      try {
        video.muted = !audioEnabled;
        video.volume = audioEnabled ? 1.0 : 0;
        video.currentTime = 0;
        await video.play();
      } catch {
        try { video.muted = true; await video.play(); } catch { /* ignore */ }
      }
    };
    const t = setTimeout(tryPlay, 100);
    return () => {
      clearTimeout(t);
      try { video.pause(); video.currentTime = 0; } catch { /* ignore */ }
    };
  }, [src, audioEnabled]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && !video.paused) { video.muted = !audioEnabled; video.volume = audioEnabled ? 1.0 : 0; }
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
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />
      {description && (
        <div className="absolute inset-x-0 bottom-10 flex justify-center px-8">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-3 max-w-3xl text-center">
            <p className="text-white/70 text-sm">{description}</p>
          </div>
        </div>
      )}
    </>
  );
}
