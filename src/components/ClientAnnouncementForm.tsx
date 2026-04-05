import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, AlertCircle, Megaphone, X } from 'lucide-react';
import { Announcement } from '@/types';
import { ClientScheduleForm } from '@/components/ClientScheduleForm';

interface ClientAnnouncementFormProps {
    clientId: string;
    onAnnouncementSubmit: (announcement: Announcement) => void;
}

export function ClientAnnouncementForm({ clientId, onAnnouncementSubmit }: ClientAnnouncementFormProps) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [scheduleStartDate, setScheduleStartDate] = useState('');
    const [scheduleEndDate, setScheduleEndDate] = useState('');
    const [scheduleTimeStart, setScheduleTimeStart] = useState('');
    const [scheduleTimeEnd, setScheduleTimeEnd] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate file size (max 10MB for images)
        const MAX_SIZE = 10 * 1024 * 1024;
        if (selectedFile.size > MAX_SIZE) {
            setError('Image size must be less than 10MB');
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(selectedFile.type)) {
            setError('Please upload an image file (JPG, PNG, GIF, WebP)');
            return;
        }

        setImageFile(selectedFile);
        setError('');

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (!title.trim()) {
                setError('Please enter a title');
                setIsLoading(false);
                return;
            }

            if (!body.trim()) {
                setError('Please enter the announcement content');
                setIsLoading(false);
                return;
            }

            const formData = new FormData();
            formData.append('client_id', clientId);
            formData.append('title', title);
            formData.append('body', body);
            
            formData.append('status', 'pending');
            formData.append('is_active', 'false');
            
            if (scheduleStartDate) formData.append('schedule_start_date', scheduleStartDate);
            if (scheduleEndDate) formData.append('schedule_end_date', scheduleEndDate);
            if (scheduleTimeStart) formData.append('schedule_time_start', scheduleTimeStart);
            if (scheduleTimeEnd) formData.append('schedule_time_end', scheduleTimeEnd);

            if (imageFile) {
                formData.append('image', imageFile);
            }

            const data = await api.upload('/announcements/', formData);

            onAnnouncementSubmit(data as Announcement);

            // Reset form
            setTitle('');
            setBody('');
            setImageFile(null);
            setImagePreview(null);
            setScheduleStartDate('');
            setScheduleEndDate('');
            setScheduleTimeStart('');
            setScheduleTimeEnd('');
        } catch (err) {
            console.error('Error submitting announcement:', err);
            setError(err instanceof Error ? err.message : 'Failed to submit announcement');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5" />
                    Create Announcement
                </CardTitle>
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
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Important Update"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="body">Content *</Label>
                        <Textarea
                            id="body"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Write your announcement content here..."
                            rows={5}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Image (Optional)</Label>
                        {imagePreview ? (
                            <div className="relative rounded-lg overflow-hidden bg-gray-100">
                                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                                <input
                                    id="announcement-image"
                                    type="file"
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <label htmlFor="announcement-image" className="cursor-pointer">
                                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-600">Click to upload an image</p>
                                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF, WebP up to 10MB</p>
                                </label>
                            </div>
                        )}
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
                    />

                    <div className="bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-md text-sm">
                        <p className="font-medium mb-1">Note:</p>
                        <p>Your announcement will be submitted for admin review. Once approved, it will appear on the display.</p>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading || !title.trim() || !body.trim()}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin mr-2">⟳</span>
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Megaphone className="w-4 h-4 mr-2" />
                                Submit for Review
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
