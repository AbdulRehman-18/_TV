import { useState } from 'react';
import { supabase, ANNOUNCEMENTS_BUCKET } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, AlertCircle, Megaphone, X } from 'lucide-react';
import { Announcement } from '@/types';

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

            let imageUrl: string | null = null;

            // Upload image if provided
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `client-uploads/${clientId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from(ANNOUNCEMENTS_BUCKET)
                    .upload(filePath, imageFile);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from(ANNOUNCEMENTS_BUCKET)
                    .getPublicUrl(filePath);

                imageUrl = urlData.publicUrl;
            }

            // Create announcement record with 'pending' status
            const { data, error: insertError } = await supabase
                .from('announcements')
                .insert({
                    title,
                    body,
                    image_url: imageUrl,
                    client_id: clientId,
                    status: 'pending',
                    is_active: false,
                    schedule_start_date: scheduleStartDate || null,
                    schedule_end_date: scheduleEndDate || null,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            onAnnouncementSubmit(data as Announcement);

            // Reset form
            setTitle('');
            setBody('');
            setImageFile(null);
            setImagePreview(null);
            setScheduleStartDate('');
            setScheduleEndDate('');
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

                    <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-gray-500 rounded"></div>
                            <h3 className="text-sm font-semibold text-gray-900">Schedule Display (Optional)</h3>
                        </div>
                        <p className="text-xs text-gray-600">Set when this announcement should automatically activate</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="scheduleStartDate" className="text-sm">Start Date</Label>
                                <Input
                                    id="scheduleStartDate"
                                    type="date"
                                    value={scheduleStartDate}
                                    onChange={(e) => setScheduleStartDate(e.target.value)}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="scheduleEndDate" className="text-sm">End Date</Label>
                                <Input
                                    id="scheduleEndDate"
                                    type="date"
                                    value={scheduleEndDate}
                                    onChange={(e) => setScheduleEndDate(e.target.value)}
                                    min={scheduleStartDate || undefined}
                                    className="bg-white"
                                />
                            </div>
                        </div>

                        {scheduleStartDate && scheduleEndDate && (
                            <div className="bg-gray-100 border border-gray-300 rounded p-2 text-xs text-gray-800">
                                <span className="font-medium">Scheduled:</span> Will be active from {new Date(scheduleStartDate).toLocaleDateString()} to {new Date(scheduleEndDate).toLocaleDateString()}
                            </div>
                        )}
                    </div>

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
