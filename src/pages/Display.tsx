import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Announcement } from '@/types';

export function Display() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
    
    // Set up real-time subscription
    const subscription = supabase
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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const activeAnnouncements = announcements.filter(a => a.is_active);
    
    if (activeAnnouncements.length === 0) {
      return;
    }

    // Auto-advance slideshow every 12 seconds
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
    }, 12000);

    return () => clearInterval(timer);
  }, [announcements]);

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

  const activeAnnouncements = announcements.filter(a => a.is_active);
  const currentAnnouncement = activeAnnouncements[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white mb-4"></div>
          <p className="text-white text-xl">Loading announcements...</p>
        </div>
      </div>
    );
  }

  if (activeAnnouncements.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-center px-8">
        <div>
          <h1 className="text-6xl font-bold text-white mb-4">
            Smart Corridor Display
          </h1>
          <p className="text-2xl text-gray-300">
            No active announcements to display
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {currentAnnouncement.image_url ? (
        // Image-based announcement
        <div className="relative min-h-screen">
          <img
            src={currentAnnouncement.image_url}
            alt={currentAnnouncement.title}
            className="w-full h-screen object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end">
            <div className="w-full p-12 lg:p-16">
              <div className="bg-black bg-opacity-75 rounded-lg p-8 lg:p-12">
                <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                  {currentAnnouncement.title}
                </h1>
                <p className="text-xl lg:text-2xl text-gray-200 leading-relaxed">
                  {currentAnnouncement.body}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Text-only announcement
        <div className="min-h-screen flex items-center justify-center px-8 lg:px-16">
          <div className="text-center max-w-5xl">
            <h1 className="text-5xl lg:text-8xl font-bold mb-8 lg:mb-12 leading-tight">
              {currentAnnouncement.title}
            </h1>
            <p className="text-2xl lg:text-4xl text-gray-300 leading-relaxed font-light">
              {currentAnnouncement.body}
            </p>
          </div>
        </div>
      )}

      {/* Slideshow indicators */}
      {activeAnnouncements.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {activeAnnouncements.map((_, index) => (
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
            width: `${((currentIndex + 1) / activeAnnouncements.length) * 100}%`
          }}
        />
      </div>
    </div>
  );
}