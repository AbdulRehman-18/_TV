import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Announcement, Event, Media } from '@/types';

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

  useEffect(() => {
    const activeAnnouncements = announcements.filter(a => a.is_active);
    const activeEvents = events.filter(e => e.is_active);
    const activeMedia = media.filter(m => m.is_active);
    
    const totalItems = activeAnnouncements.length + activeEvents.length + activeMedia.length;
    
    if (totalItems === 0) {
      return;
    }

    // Auto-advance slideshow every 12 seconds
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalItems);
    }, 12000);

    return () => clearInterval(timer);
  }, [announcements, events, media]);

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
  const allItems: (Announcement & { type: 'announcement' } | Event & { type: 'event' } | Media & { type: 'media' })[] = [
    ...activeAnnouncements.map(item => ({ ...item, type: 'announcement' as const })),
    ...activeEvents.map(item => ({ ...item, type: 'event' as const })),
    ...activeMedia.map(item => ({ ...item, type: 'media' as const }))
  ];
  
  const currentItem = allItems[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white mb-4"></div>
          <p className="text-white text-xl">Loading content...</p>
        </div>
      </div>
    );
  }

  if (allItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-center px-8">
        <div>
          <h1 className="text-6xl font-bold text-white mb-4">
            Smart Corridor Display
          </h1>
          <p className="text-2xl text-gray-300">
            No active content to display
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {currentItem.type === 'announcement' ? (
        // Announcement display
        (currentItem as Announcement & { type: 'announcement' }).image_url ? (
          // Image-based announcement
          <div className="relative min-h-screen">
            <img
              src={(currentItem as Announcement & { type: 'announcement' }).image_url!}
              alt={(currentItem as Announcement & { type: 'announcement' }).title}
              className="w-full h-screen object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end">
              <div className="w-full p-12 lg:p-16">
                <div className="bg-black bg-opacity-75 rounded-lg p-8 lg:p-12">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      ANNOUNCEMENT
                    </div>
                  </div>
                  <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                    {(currentItem as Announcement & { type: 'announcement' }).title}
                  </h1>
                  <p className="text-xl lg:text-2xl text-gray-200 leading-relaxed">
                    {(currentItem as Announcement & { type: 'announcement' }).body}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Text-only announcement
          <div className="min-h-screen flex items-center justify-center px-8 lg:px-16">
            <div className="text-center max-w-5xl">
              <div className="flex items-center justify-center mb-8">
                <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-lg font-medium">
                  ANNOUNCEMENT
                </div>
              </div>
              <h1 className="text-5xl lg:text-8xl font-bold mb-8 lg:mb-12 leading-tight">
                {(currentItem as Announcement & { type: 'announcement' }).title}
              </h1>
              <p className="text-2xl lg:text-4xl text-gray-300 leading-relaxed font-light">
                {(currentItem as Announcement & { type: 'announcement' }).body}
              </p>
            </div>
          </div>
        )
      ) : currentItem.type === 'event' ? (
        // Event display
        (currentItem as Event & { type: 'event' }).image_url ? (
          // Image-based event
          <div className="relative min-h-screen">
            <img
              src={(currentItem as Event & { type: 'event' }).image_url!}
              alt={(currentItem as Event & { type: 'event' }).title}
              className="w-full h-screen object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end">
              <div className="w-full p-12 lg:p-16">
                <div className="bg-black bg-opacity-75 rounded-lg p-8 lg:p-12">
                  <div className="flex items-center mb-4">
                    <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      EVENT
                    </div>
                  </div>
                  <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                    {(currentItem as Event & { type: 'event' }).title}
                  </h1>
                  <p className="text-xl lg:text-2xl text-gray-200 leading-relaxed mb-6">
                    {(currentItem as Event & { type: 'event' }).description}
                  </p>
                  
                  {/* Event details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        📅
                      </div>
                      <div>
                        <div className="text-sm font-medium">Date</div>
                        <div className="text-lg">{new Date((currentItem as Event & { type: 'event' }).start_date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        🕒
                      </div>
                      <div>
                        <div className="text-sm font-medium">Time</div>
                        <div className="text-lg">
                          {new Date((currentItem as Event & { type: 'event' }).start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          {(currentItem as Event & { type: 'event' }).end_date && ` - ${new Date((currentItem as Event & { type: 'event' }).end_date!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                        </div>
                      </div>
                    </div>
                    
                    {(currentItem as Event & { type: 'event' }).location && (
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                          📍
                        </div>
                        <div>
                          <div className="text-sm font-medium">Location</div>
                          <div className="text-lg">{(currentItem as Event & { type: 'event' }).location}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Text-only event
          <div className="min-h-screen flex items-center justify-center px-8 lg:px-16">
            <div className="text-center max-w-5xl">
              <div className="flex items-center justify-center mb-8">
                <div className="bg-green-600 text-white px-4 py-2 rounded-full text-lg font-medium">
                  EVENT
                </div>
              </div>
              <h1 className="text-5xl lg:text-8xl font-bold mb-8 lg:mb-12 leading-tight">
                {(currentItem as Event & { type: 'event' }).title}
              </h1>
              <p className="text-2xl lg:text-4xl text-gray-300 leading-relaxed font-light mb-12">
                {(currentItem as Event & { type: 'event' }).description}
              </p>
              
              {/* Event details for text-only */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="bg-white bg-opacity-10 rounded-lg p-6">
                  <div className="text-4xl mb-4">📅</div>
                  <div className="text-lg font-medium mb-2">Date</div>
                  <div className="text-xl">{new Date((currentItem as Event & { type: 'event' }).start_date).toLocaleDateString()}</div>
                </div>
                
                <div className="bg-white bg-opacity-10 rounded-lg p-6">
                  <div className="text-4xl mb-4">🕒</div>
                  <div className="text-lg font-medium mb-2">Time</div>
                  <div className="text-xl">
                    {new Date((currentItem as Event & { type: 'event' }).start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    {(currentItem as Event & { type: 'event' }).end_date && ` - ${new Date((currentItem as Event & { type: 'event' }).end_date!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                  </div>
                </div>
                
                {(currentItem as Event & { type: 'event' }).location && (
                  <div className="bg-white bg-opacity-10 rounded-lg p-6">
                    <div className="text-4xl mb-4">📍</div>
                    <div className="text-lg font-medium mb-2">Location</div>
                    <div className="text-xl">{(currentItem as Event & { type: 'event' }).location}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      ) : (
        // Media display
        (currentItem as Media & { type: 'media' }).file_type === 'image' ? (
          // Image media display - clean display without overlay, maintains aspect ratio
          <div className="min-h-screen flex items-center justify-center bg-black">
            <img
              src={(currentItem as Media & { type: 'media' }).file_url}
              alt={(currentItem as Media & { type: 'media' }).title}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          // Video media display - clean display without overlay
          <div className="min-h-screen bg-black">
            <video
              src={(currentItem as Media & { type: 'media' }).file_url}
              className="w-full h-screen object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          </div>
        )
      )}

      {/* Slideshow indicators */}
      {allItems.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {allItems.map((_, index) => (
            <div
              key={index}
              className={`h-3 w-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-white scale-125' 
                  : 'bg-white bg-opacity-50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Auto-advance progress bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white bg-opacity-20">
        <div 
          className="h-full bg-white transition-all duration-300 ease-linear"
          style={{
            width: `${((currentIndex + 1) / allItems.length) * 100}%`
          }}
        />
      </div>
    </div>
  );
}