import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Users, UserPlus, Clock, CheckCircle, UserMinus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import useConnectionStatus from '../hooks/useConnectionStatus';
import MainLayout from '../components/layout/MainLayout';

// Profile components
import ProfileHeader from '../components/profile/ProfileHeader';
import AboutSection from '../components/profile/AboutSection';
import ActivitySection from '../components/profile/ActivitySection';
import ExperienceSection from '../components/profile/ExperienceSection';
import EducationSection from '../components/profile/EducationSection';
import SkillsSection from '../components/profile/SkillsSection';
import ProfileSidebar from '../components/profile/ProfileSidebar';

// UI
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';
import ConfirmAction from '../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

/* ─── Shimmer Skeleton ─────────────────────────────────────────── */
function Shimmer({ className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-gray-200/70 rounded ${className}`} style={{ isolation: 'isolate' }}>
      <div
        className="absolute inset-0 -translate-x-full"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
          animation: 'shimmer 1.8s ease-in-out infinite',
        }}
      />
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-[1024px] mx-auto space-y-4">
      {/* Hero skeleton */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-border overflow-hidden">
        <Shimmer className="h-48 md:h-56 w-full rounded-none" />
        <div className="px-8 pb-6 flex gap-5">
          <div className="-mt-16 md:-mt-20 flex-shrink-0">
            <Shimmer className="w-32 h-32 md:w-36 md:h-36 rounded-full ring-[5px] ring-white" />
          </div>
          <div className="flex-1 pt-4 space-y-3">
            <Shimmer className="h-7 w-52 rounded-md" />
            <Shimmer className="h-4 w-80 rounded-md" />
            <Shimmer className="h-3.5 w-40 rounded-md" />
            <Shimmer className="h-3 w-24 rounded-md" />
            <div className="flex gap-3 pt-3">
              <Shimmer className="h-10 w-28 rounded-full" />
              <Shimmer className="h-10 w-24 rounded-full" />
              <Shimmer className="h-10 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex gap-4">
        <div className="flex-1 space-y-4">
          <div className="bg-white rounded-2xl shadow-card border border-surface-border p-7 space-y-4">
            <Shimmer className="h-5 w-16 rounded-md" />
            <Shimmer className="h-3 w-full rounded-md" />
            <Shimmer className="h-3 w-5/6 rounded-md" />
            <Shimmer className="h-3 w-4/6 rounded-md" />
          </div>
          <div className="bg-white rounded-2xl shadow-card border border-surface-border p-7 space-y-4">
            <Shimmer className="h-5 w-24 rounded-md" />
            <div className="flex gap-4">
              <Shimmer className="w-11 h-11 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Shimmer className="h-4 w-44 rounded-md" />
                <Shimmer className="h-3 w-36 rounded-md" />
                <Shimmer className="h-2.5 w-24 rounded-md" />
              </div>
            </div>
          </div>
        </div>
        <div className="w-[300px] hidden lg:block space-y-4">
          <div className="bg-white rounded-2xl shadow-card border border-surface-border p-5 space-y-3">
            <Shimmer className="h-4 w-32 rounded-md" />
            <Shimmer className="h-9 w-full rounded-xl" />
          </div>
          <div className="bg-white rounded-2xl shadow-card border border-surface-border p-5 space-y-3">
            <Shimmer className="h-4 w-36 rounded-md" />
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Shimmer className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Shimmer className="h-3 w-24 rounded-md" />
                    <Shimmer className="h-2.5 w-32 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Connection Status Badge (for connections tab) ───────────── */
function ConnectionStatusBadge({ userId }) {
  const { status, sendRequest } = useConnectionStatus(userId);

  if (status === 'self') return null;
  if (status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
        <CheckCircle size={12} /> Connected
      </span>
    );
  }
  if (status === 'pending_sent' || status === 'pending_received') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
        <Clock size={12} /> Pending
      </span>
    );
  }
  return (
    <button
      onClick={(e) => { e.preventDefault(); sendRequest.mutate(); }}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary text-xs font-semibold hover:bg-primary-100 transition-colors"
    >
      <UserPlus size={12} /> Connect
    </button>
  );
}

/* ─── Connections Tab ──────────────────────────────────────────── */
function ConnectionsTab({ profile, isOwner }) {
  const queryClient = useQueryClient();

  const { data: ownConnectionsData, isLoading: ownLoading } = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get('/connections').then((r) => r.data),
    enabled: isOwner,
  });

  const removeMutation = useMutation({
    mutationFn: (userId) => api.delete(`/connections/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'profile' });
      toast.success('Connection removed');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove connection'),
  });

  const connections = isOwner
    ? (ownConnectionsData?.connections || [])
    : (profile.connections || []);

  if (isOwner && ownLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6">
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-2 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-surface-border text-center py-14">
        <Users size={36} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-400 text-sm">No connections yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-card border border-surface-border overflow-hidden">
      <div className="divide-y divide-gray-100">
        {connections.map((person) => (
          <div key={person._id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors">
            <Link
              to={`/profile/${person.username || person._id}`}
              className="flex items-center gap-3.5 min-w-0 flex-1"
            >
              <Avatar src={person.profilePic} name={person.name} size="md" />
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{person.name}</p>
                {person.headline && (
                  <p className="text-xs text-gray-500 truncate max-w-[240px]">{person.headline}</p>
                )}
                {person.location && (
                  <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                    <MapPin size={10} /> {person.location}
                  </p>
                )}
              </div>
            </Link>
            <div className="flex-shrink-0 ml-3">
              {isOwner ? (
                <ConfirmAction
                  onConfirm={() => removeMutation.mutate(person._id)}
                  message={`Remove ${person.name}?`}
                  confirmLabel="Remove"
                >
                  {(requestConfirm) => (
                    <button
                      onClick={requestConfirm}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <UserMinus size={13} /> Remove
                    </button>
                  )}
                </ConfirmAction>
              ) : (
                <ConnectionStatusBadge userId={person._id} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Interests Section ───────────────────────────────────────── */
function InterestsSection({ interests }) {
  if (!interests?.length) return null;

  return (
    <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 md:p-7">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Interests</h2>
      <div className="flex flex-wrap gap-2.5">
        {interests.map((interest) => (
          <span
            key={interest}
            className="text-sm px-4 py-2 bg-primary-50/60 text-primary rounded-full font-medium border border-primary-100 hover:bg-primary-50 transition-colors cursor-default"
          >
            {interest}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('about');

  const { data, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => api.get(`/users/${id}`).then((r) => r.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ['userStats', data?.user?._id],
    queryFn: () => api.get(`/users/${data.user._id}/stats`).then((r) => r.data),
    enabled: !!data?.user?._id,
  });

  const { data: mutualData } = useQuery({
    queryKey: ['mutuals', data?.user?._id],
    queryFn: () => api.get(`/connections/mutual/${data.user._id}`).then((r) => r.data),
    enabled: !!data?.user?._id && data?.user?._id !== me?._id,
  });

  const profile = data?.user;
  const stats = statsData?.stats;
  const mutuals = mutualData?.mutuals || [];
  const isOwner = me?._id === profile?._id;
  const connectionCount = stats?.connectionCount ?? profile?.connections?.length ?? 0;

  // Redirect ObjectId URLs to username
  useEffect(() => {
    if (!isLoading && profile) {
      const isObjectId = /^[a-f\d]{24}$/i.test(id);
      if (isObjectId && profile.username && id !== profile.username) {
        navigate(`/profile/${profile.username}`, { replace: true });
      }
    }
  }, [isLoading, profile, id, navigate]);

  if (isLoading) {
    return (
      <MainLayout>
        <ProfileSkeleton />
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="max-w-[1024px] mx-auto">
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Users size={32} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Profile not found</h2>
            <p className="text-sm text-gray-400">This user may have been removed or the link is incorrect.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const tabs = [
    { key: 'about', label: 'About' },
    { key: 'activity', label: 'Activity' },
    { key: 'connections', label: 'Connections', count: connectionCount },
  ];

  return (
    <MainLayout>
      <div className="max-w-[1024px] mx-auto space-y-4">
        {/* ── Hero Card (Full Width) ─────────────────────── */}
        <ProfileHeader profile={profile} stats={stats} isOwner={isOwner} />

        {/* ── Two Column Layout ──────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* Left: Main content */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Nav tabs */}
            <div className="bg-white rounded-2xl shadow-card border border-surface-border px-2">
              <div className="flex gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-5 py-3.5 text-sm font-semibold border-b-[3px] transition-all flex items-center gap-2 ${
                      activeTab === tab.key
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                        activeTab === tab.key
                          ? 'bg-primary-50 text-primary'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* About tab */}
            {activeTab === 'about' && (
              <>
                <AboutSection about={profile.about || profile.bio} isOwner={isOwner} />
                <ExperienceSection experiences={profile.experience || []} isOwner={isOwner} userId={profile._id} />
                <EducationSection educations={profile.education || []} isOwner={isOwner} userId={profile._id} />
                <SkillsSection skills={profile.skills || []} isOwner={isOwner} userId={profile._id} />
                <InterestsSection interests={profile.interests} />
              </>
            )}

            {/* Activity tab */}
            {activeTab === 'activity' && (
              <ActivitySection userId={profile._id} isOwner={isOwner} userName={profile.name} />
            )}

            {/* Connections tab */}
            {activeTab === 'connections' && (
              <ConnectionsTab profile={profile} isOwner={isOwner} />
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="w-full lg:w-[300px] flex-shrink-0">
            <ProfileSidebar
              profile={profile}
              stats={stats}
              isOwner={isOwner}
              mutuals={mutuals}
              mutualCount={mutualData?.count}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
