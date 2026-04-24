import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Lock, Bell, Shield, Camera, Save, Eye, EyeOff } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'profile', label: 'Edit Profile', icon: User },
  { key: 'account', label: 'Account', icon: Lock },
  { key: 'privacy', label: 'Privacy', icon: Shield },
];

function EditProfileTab() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    headline: user?.headline || '',
    about: user?.about || user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    skills: (user?.skills || []).join(', '),
    interests: (user?.interests || []).join(', '),
  });
  const [profilePic, setProfilePic] = useState(null);
  const [bannerPic, setBannerPic] = useState(null);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'skills' || k === 'interests') {
          fd.append(
            k,
            JSON.stringify(
              v
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            )
          );
        } else {
          fd.append(k, v);
        }
      });
      if (profilePic) fd.append('profilePic', profilePic);
      if (bannerPic) fd.append('bannerPic', bannerPic);

      return api.put('/users/update', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (res) => {
      const data = res?.data || res;
      setUser(data.user);
      // Invalidate profile queries (by id or username)
      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'profile',
      });
      toast.success('Profile updated!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="space-y-5">
      {/* Photos */}
      <div className="relative">
        <div className="h-28 bg-primary-900 rounded-card overflow-hidden relative">
          {(bannerPic || user?.bannerPic) && (
            <img
              src={bannerPic ? URL.createObjectURL(bannerPic) : user.bannerPic}
              className="w-full h-full object-cover"
              alt=""
            />
          )}
          <label className="absolute bottom-2 right-2 p-1.5 bg-white/80 rounded-lg cursor-pointer hover:bg-white transition-colors">
            <Camera size={14} className="text-gray-600" />
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => setBannerPic(e.target.files[0])}
            />
          </label>
        </div>
        <div className="absolute -bottom-8 left-6">
          <div className="relative">
            <Avatar
              src={profilePic ? URL.createObjectURL(profilePic) : user?.profilePic}
              name={user?.name}
              size="xl"
            />
            <label className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md cursor-pointer hover:bg-gray-50 transition-colors">
              <Camera size={12} className="text-gray-600" />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => setProfilePic(e.target.files[0])}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="pt-8 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Full Name</label>
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="input-base"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Username</label>
            <input
              value={form.username}
              onChange={(e) => update('username', e.target.value)}
              className="input-base"
              placeholder="john-doe"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Headline</label>
          <input
            value={form.headline}
            onChange={(e) => update('headline', e.target.value)}
            className="input-base"
            placeholder="Senior Software Engineer at Google"
            maxLength={220}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">About</label>
          <textarea
            value={form.about}
            onChange={(e) => update('about', e.target.value)}
            className="input-base min-h-[100px] resize-y"
            placeholder="Tell people about yourself..."
            maxLength={2600}
          />
          <p className="text-[10px] text-gray-400 text-right mt-0.5">{form.about.length}/2600</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Location</label>
            <input
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              className="input-base"
              placeholder="San Francisco, CA"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Website</label>
            <input
              value={form.website}
              onChange={(e) => update('website', e.target.value)}
              className="input-base"
              placeholder="https://yoursite.com"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Skills (comma-separated)
          </label>
          <input
            value={form.skills}
            onChange={(e) => update('skills', e.target.value)}
            className="input-base"
            placeholder="React, Node.js, MongoDB, TypeScript"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Interests (comma-separated)
          </label>
          <input
            value={form.interests}
            onChange={(e) => update('interests', e.target.value)}
            className="input-base"
            placeholder="AI, Web3, Product Design"
          />
        </div>

        <Button
          variant="primary"
          onClick={() => updateMutation.mutate()}
          loading={updateMutation.isPending}
          className="flex items-center gap-2"
        >
          <Save size={14} /> Save Changes
        </Button>
      </div>
    </div>
  );
}

function AccountTab() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const changePwMutation = useMutation({
    mutationFn: () =>
      api.put('/users/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }),
    onSuccess: () => {
      toast.success('Password changed!');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return toast.error("Passwords don't match");
    if (form.newPassword.length < 6) return toast.error('Min 6 characters');
    changePwMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <h3 className="font-bold text-gray-900">Change Password</h3>
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">Current Password</label>
        <div className="relative">
          <input
            type={showCurrent ? 'text' : 'password'}
            value={form.currentPassword}
            onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
            className="input-base pr-10"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">New Password</label>
        <div className="relative">
          <input
            type={showNew ? 'text' : 'password'}
            value={form.newPassword}
            onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
            className="input-base pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNew((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">Confirm New Password</label>
        <input
          type="password"
          value={form.confirmPassword}
          onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
          className="input-base"
        />
      </div>
      <Button type="submit" variant="primary" loading={changePwMutation.isPending}>
        Update Password
      </Button>
    </form>
  );
}

function PrivacyTab() {
  const { user, setUser } = useAuth();
  const [isPublic, setIsPublic] = useState(user?.isPublic ?? true);
  const [emailNotif, setEmailNotif] = useState(user?.emailNotifications ?? true);

  const mutation = useMutation({
    mutationFn: () => api.put('/users/privacy', { isPublic, emailNotifications: emailNotif }),
    onSuccess: ({ data }) => {
      setUser(data.user);
      toast.success('Privacy settings updated');
    },
  });

  return (
    <div className="space-y-6 max-w-md">
      <h3 className="font-bold text-gray-900">Privacy Settings</h3>
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-900">Public Profile</p>
          <p className="text-xs text-gray-500">Others can find you in search</p>
        </div>
        <button
          onClick={() => setIsPublic((p) => !p)}
          className={`w-10 h-5 rounded-full transition-colors relative ${isPublic ? 'bg-primary' : 'bg-gray-300'}`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPublic ? 'left-5' : 'left-0.5'}`}
          />
        </button>
      </div>
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-900">Email Notifications</p>
          <p className="text-xs text-gray-500">Receive email updates</p>
        </div>
        <button
          onClick={() => setEmailNotif((p) => !p)}
          className={`w-10 h-5 rounded-full transition-colors relative ${emailNotif ? 'bg-primary' : 'bg-gray-300'}`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${emailNotif ? 'left-5' : 'left-0.5'}`}
          />
        </button>
      </div>
      <Button variant="primary" onClick={() => mutation.mutate()} loading={mutation.isPending}>
        Save Privacy Settings
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <MainLayout>
      <div className="max-w-[760px] mx-auto">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-5">Settings</h1>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Tab sidebar */}
          <div className="sm:w-[200px] flex sm:flex-col gap-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
                  activeTab === key
                    ? 'bg-primary-50 text-primary'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <Card className="flex-1 p-6">
            {activeTab === 'profile' && <EditProfileTab />}
            {activeTab === 'account' && <AccountTab />}
            {activeTab === 'privacy' && <PrivacyTab />}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
