import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { type Media } from '@/types';
import { Card } from '@/components/ui/card';
import { Video, ImageIcon } from 'lucide-react';

export function Gallery() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      // Using Django API with server-side filtering
      const data = await api.get('/media/?status=approved');
      setMedia(data);
    } catch (error) {
      console.error('Error loading gallery media:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gallery</h1>
        <p className="text-gray-500 mt-1">A visual collection of all approved media assets.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : media.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
          <div className="text-center py-20">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No media found</h3>
            <p className="text-gray-500">Upload and approve media to see it in the gallery.</p>
          </div>
        </Card>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
          {media.map((item) => (
            <div key={item.id} className="break-inside-avoid relative group rounded-xl overflow-hidden bg-gray-100 shadow-sm border border-gray-200">
              {item.file_type === 'image' ? (
                <img
                  src={item.file_url}
                  alt={item.title}
                  className="w-full h-auto object-cover"
                />
              ) : (
                <div className="aspect-video bg-gray-900 flex items-center justify-center">
                  <Video className="w-8 h-8 text-white opacity-50 space-y-4" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <h3 className="text-white font-medium truncate">{item.title}</h3>
                {item.file_type === 'image' ? (
                  <div className="flex items-center text-gray-300 text-xs mt-1">
                    <ImageIcon className="w-3 h-3 mr-1" /> Image
                  </div>
                ) : (
                  <div className="flex items-center text-gray-300 text-xs mt-1">
                    <Video className="w-3 h-3 mr-1" /> Video
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
