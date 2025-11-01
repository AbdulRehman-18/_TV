import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Save, User as UserIcon } from 'lucide-react';
import type { Client as ClientType } from '@/types';

interface SettingsProps {
  clientProfile: ClientType | null;
  onUpdate?: (profile: ClientType) => void;
}

export function Settings({ clientProfile, onUpdate }: SettingsProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ClientType | null>(clientProfile);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setProfile(clientProfile);
  }, [clientProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSave = async () => {
    if (!profile || !user?.id) return;

    setSaving(true);
    setMessage(null);

    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          name: profile.name,
          email: profile.email,
          organization: profile.organization,
          phone_number: profile.phone_number,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      onUpdate?.(data);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">Manage your profile and account information</p>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            message.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`} />
          <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </p>
        </div>
      )}

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{profile?.name || 'Client'}</h2>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 border-t pt-6">
            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={profile?.name || ''}
                onChange={handleInputChange}
                placeholder="Your full name"
                className="mt-2"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={profile?.email || ''}
                onChange={handleInputChange}
                placeholder="your@email.com"
                className="mt-2"
              />
            </div>

            {/* Organization */}
            <div>
              <Label htmlFor="organization" className="text-sm font-medium text-gray-700">Organization</Label>
              <Input
                id="organization"
                name="organization"
                value={profile?.organization || ''}
                onChange={handleInputChange}
                placeholder="Your organization name"
                className="mt-2"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone_number" className="text-sm font-medium text-gray-700">Phone Number</Label>
              <Input
                id="phone_number"
                name="phone_number"
                type="tel"
                value={profile?.phone_number || ''}
                onChange={handleInputChange}
                placeholder="Your phone number"
                className="mt-2"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="border-t pt-6 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
