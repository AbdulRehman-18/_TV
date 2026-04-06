import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Upload, AlertCircle } from 'lucide-react';
import { Media } from '@/types';
import { ClientScheduleForm } from '@/components/ClientScheduleForm';

interface ClientMediaFormProps {
  clientId: string;
  onMediaUpload: (media: Media) => void;
}

export function ClientMediaForm({ clientId, onMediaUpload }: ClientMediaFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [scheduleStartDate, setScheduleStartDate] = useState('');
  const [scheduleEndDate, setScheduleEndDate] = useState('');
  const [scheduleTimeStart, setScheduleTimeStart] = useState('');
  const [scheduleTimeEnd, setScheduleTimeEnd] = useState('');
  const [duration, setDuration] = useState(12);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size (max 100MB)
    const MAX_SIZE = 100 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE) {
      setError('File size must be less than 100MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('File type not supported. Please upload an image (JPG, PNG, GIF) or video (MP4, WebM)');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setError('');

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!file) {
        setError('Please select a file');
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('client_id', clientId);
      if (title) formData.append('title', title);
      else formData.append('title', file.name); // Default title if not provided
      
      if (description) formData.append('description', description);
      
      formData.append('is_active', 'false');
      formData.append('status', 'pending');
      
      if (file) {
        formData.append('file', file);
        formData.append('file_type', file.type.startsWith('video/') ? 'video' : 'image');
        formData.append('file_name', file.name);
        formData.append('file_size', file.size.toString());
      }
      
      if (scheduleStartDate) formData.append('schedule_start_date', scheduleStartDate);
      if (scheduleEndDate) formData.append('schedule_end_date', scheduleEndDate);
      if (scheduleTimeStart) formData.append('schedule_time_start', scheduleTimeStart);
      if (scheduleTimeEnd) formData.append('schedule_time_end', scheduleTimeEnd);
      formData.append('duration', duration.toString());

      const mediaData = await api.upload('/media/', formData);

      onMediaUpload(mediaData as Media);

      // Reset form
      setTitle('');
      setDescription('');
      setFile(null);
      setFileName('');
      setPreview(null);
      setScheduleStartDate('');
      setScheduleEndDate('');
      setScheduleTimeStart('');
      setScheduleTimeEnd('');
      setDuration(12);
    } catch (err) {
      console.error('Error uploading media:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload media');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload New Media</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Company Presentation Q4 2025"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of your media file"
              rows={4}
            />
          </div>

          <ClientScheduleForm
            scheduleStartDate={scheduleStartDate}
            scheduleEndDate={scheduleEndDate}
            onStartDateChange={setScheduleStartDate}
            onEndDateChange={setScheduleEndDate}
            scheduleTimeStart={scheduleTimeStart}
            scheduleTimeEnd={scheduleTimeEnd}
            onTimeStartChange={setScheduleTimeStart}
            onTimeEndChange={setScheduleTimeEnd}
            duration={duration}
            onDurationChange={setDuration}
          />

          <div className="space-y-2">
            <Label htmlFor="file">File *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept="image/*,video/*"
                className="hidden"
              />
              <label htmlFor="file" className="cursor-pointer">
                <div className="space-y-2">
                  <Upload className="w-12 h-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {fileName ? `Selected: ${fileName}` : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      PNG, JPG, GIF, MP4 or WebM up to 100MB
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {preview && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="rounded-lg overflow-hidden bg-gray-100">
                <img src={preview} alt="Preview" className="w-full h-auto max-h-96" />
              </div>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-md text-sm">
            <p className="font-medium mb-1">Note:</p>
            <p>Your media will be submitted for admin review. Once approved, it will appear on the display.</p>
          </div>

          <div className="flex space-x-4">
            <Button
              type="submit"
              disabled={isLoading || !file}
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit for Review
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
