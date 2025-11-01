import { useState } from 'react';
import { supabase, MEDIA_BUCKET } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Video } from 'lucide-react';
import { Media } from '@/types';

interface MediaFormProps {
  media?: Media;
  onSubmit: (media: Media) => void;
  onCancel: () => void;
}

export function MediaForm({ media, onSubmit, onCancel }: MediaFormProps) {
  const [title, setTitle] = useState(media?.title || '');
  const [description, setDescription] = useState(media?.description || '');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(media?.file_url || null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(media?.file_type || null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (file: File): Promise<{ url: string; fileName: string; fileSize: number }> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(MEDIA_BUCKET)
        .getPublicUrl(fileName);

      return {
        url: data.publicUrl,
        fileName,
        fileSize: file.size
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let fileData = {
        file_url: media?.file_url || '',
        file_name: media?.file_name || '',
        file_size: media?.file_size || 0,
        file_type: fileType || 'image'
      };

      // Upload new file if provided
      if (file) {
        const uploadResult = await handleFileUpload(file);
        fileData = {
          file_url: uploadResult.url,
          file_name: uploadResult.fileName,
          file_size: uploadResult.fileSize,
          file_type: file!.type.startsWith('video/') ? 'video' : 'image'
        };
      }

      const mediaData = {
        title,
        description: description || null,
        ...fileData,
        is_active: true,
        client_id: null, // Admin uploads don't have a client
        status: 'approved', // Admin uploads are pre-approved
      };

      let result;

      if (media) {
        // Update existing media
        result = await supabase
          .from('media')
          .update(mediaData)
          .eq('id', media.id)
          .select()
          .single();
      } else {
        // Create new media
        result = await supabase
          .from('media')
          .insert(mediaData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      onSubmit(result.data);

      // Notify other tabs/windows (same origin) that media changed.
      try {
        const bc = new BroadcastChannel('tv-updates');
        const msg = { channel: 'media', action: media ? 'update' : 'create', payload: result.data };
        console.debug('[MediaForm] broadcasting', msg);
        bc.postMessage(msg);
        bc.close();
      } catch {
        // ignore
      }
    } catch (error) {
      console.error('Error saving media:', error);
      alert('Error saving media. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);

      // Determine file type
      if (selectedFile.type.startsWith('video/')) {
        setFileType('video');
      } else if (selectedFile.type.startsWith('image/')) {
        setFileType('image');
      }

      // Create preview
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    setFileType(null);
  };

  const acceptedTypes = "image/*,video/*";

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {media ? 'Edit Media' : 'Upload New Media'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Media Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter media title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter media description"
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Media File</Label>

            {filePreview ? (
              <div className="relative">
                {fileType === 'image' ? (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-900 rounded-md flex items-center justify-center">
                    <div className="text-center text-white">
                      <Video className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">Video file selected</p>
                      <p className="text-xs text-gray-300">{file?.name}</p>
                    </div>
                  </div>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : media?.file_url ? (
              <div className="relative">
                {media.file_type === 'image' ? (
                  <img
                    src={media.file_url}
                    alt="Current media"
                    className="w-full h-48 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-900 rounded-md flex items-center justify-center">
                    <div className="text-center text-white">
                      <Video className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">Current video file</p>
                    </div>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                  Current file
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm text-gray-600 block mb-2">
                    Click to upload an image or video
                  </span>
                  <span className="text-xs text-gray-500">
                    Supports: JPG, PNG, GIF, MP4, WebM, MOV
                  </span>
                  <Input
                    id="file-upload"
                    type="file"
                    accept={acceptedTypes}
                    onChange={handleFileChange}
                    className="hidden"
                    required={!media}
                  />
                </Label>
              </div>
            )}

            {file && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                {fileType === 'image' ? (
                  <ImageIcon className="h-4 w-4" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
                <span>{file.name}</span>
                <span className="text-gray-400">•</span>
                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Uploading...' : media ? 'Update Media' : 'Upload Media'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}