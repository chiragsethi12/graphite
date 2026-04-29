import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Edit2, BarChart2, Award, Users, Share2, Globe, Copy, UserMinus, UserPlus, Clock, CheckCircle, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import useConnectionStatus from '../hooks/useConnectionStatus';
import MainLayout from '../components/layout/MainLayout';
import ExperienceSection from '../components/profile/ExperienceSection';
import EducationSection from '../components/profile/EducationSection';
import SkillsSection from '../components/profile/SkillsSection';
import ProfileCompletionCard from '../components/profile/ProfileCompletionCard';
import PostCard from '../components/feed/PostCard';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ConfirmAction from '../components/ui/ConfirmDialog';
import { ProfileSidebarSkeleton, ProfileContentSkeleton } from '../components/ui/SkeletonScreens';
import formatRelativeTime from '../utils/formatRelativeTime';
import toast from 'react-hot-toast';

function ConnectionButton({ userId }) {
  const { status, sendRequest, withdraw, respond, remove } = useConnectionStatus(userId);

  if (status === 'self') return null;

  if (status === 'connected') {
    return (
      <ConfirmAction
        onConfirm={() => remove.mutate()}
        message="Remove connection?"
        confirmLabel="Remove"
      >
        {(requestConfirm) => (
          <Button variant="outline" fullWidth size="sm" onClick={requestConfirm}>
            ✓ Connected
          </Button>
        )}
      </ConfirmAction>
    );
  }

  if (status === 'pending_sent') {
    return (
      <ConfirmAction
        onConfirm={() => withdraw.mutate()}
        message="Withdraw request?"
        confirmLabel="Withdraw"
        variant="warning"
      >
        {(requestConfirm) => (
          <Button variant="ghost" fullWidth size="sm" onClick={requestConfirm}>
            Pending · Withdraw
          </Button>
        )}
      </ConfirmAction>
    );
  }

  if (status === 'pending_received') {
    return (
      <div className="flex gap-2">
        <Button variant="primary" size="sm" className="flex-1" onClick={() => respond.mutate('accept')}>
          Accept
        </Button>
        <Button variant="ghost" size="sm" className="flex-1" onClick={() => respond.mutate('reject')}>
          Decline
        </Button>
      </div>
    );
  }

  return (
    <Button variant="primary" fullWidth size="sm" onClick={() => sendRequest.mutate()} loading={sendRequest.isPending}>
      Connect
    </Button>
  );
}

/* ─── Inline connection status badge for other users' connections list ─── */
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

/* ─── Profile Viewers Widget ─── */
function ProfileViewersWidget({ profile, stats }) {
  // Filter views from the last 7 days
  const weeklyViews = useMemo(() => {
    if (!profile.profileViewHistory?.length) return [];
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return profile.profileViewHistory.filter(
      (v) => v.viewedAt && new Date(v.viewedAt).getTime() > weekAgo
    );
  }, [profile.profileViewHistory]);

  const recentViewers = useMemo(() => {
    if (!profile.profileViewHistory?.length) return [];
    return profile.profileViewHistory
      .slice()
      .reverse()
      .filter((v) => v.viewerId)
      .slice(0, 5);
  }, [profile.profileViewHistory]);

  if (!profile.profileViewHistory?.length) return null;

  const latestViewer = recentViewers[0]?.viewerId;
  const othersCount = Math.max(0, (stats?.profileViews || profile.profileViewHistory.length) - 1);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Eye size={16} className="text-primary" />
        <p className="text-sm font-semibold text-gray-800">Who viewed your profile</p>
      </div>

      {/* Avatar stack */}
      {recentViewers.length > 0 && (
        <div className="flex -space-x-2 overflow-hidden mb-2">
          {recentViewers.map((view, i) => (
            view.viewerId && (
              <Link
                key={i}
                to={`/profile/${view.viewerId.username || view.viewerId._id}`}
                className="inline-block ring-2 ring-white rounded-full hover:z-10 transition-transform hover:scale-110"
              >
                <Avatar src={view.viewerId.profilePic} name={view.viewerId.name} size="xs" />
              </Link>
            )
          ))}
        </div>
      )}

      {/* Summary text */}
      <p className="text-xs text-gray-500 leading-snug mt-2">
        Viewed by{' '}
        {latestViewer && (
          <Link
            to={`/profile/${latestViewer.username || latestViewer._id}`}
            className="font-semibold text-gray-700 hover:text-primary transition-colors"
          >
            {latestViewer.name}
          </Link>
        )}
        {othersCount > 0 && (
          <span> and <span className="font-semibold text-gray-700">{othersCount} other{othersCount !== 1 ? 's' : ''}</span></span>
        )}
        {weeklyViews.length > 0 && (
          <span className="text-gray-400"> · {weeklyViews.length} this week</span>
        )}
      </p>
    </Card>
  );
}

/* ─── Connections Tab Content ─── */
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
      <Card className="p-6">
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
      </Card>
    );
  }

  if (connections.length === 0) {
    return (
      <Card className="text-center py-12">
        <Users size={32} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-400 text-sm">No connections yet.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="divide-y divide-gray-100">
        {connections.map((person) => (
          <div
            key={person._id}
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <Link
              to={`/profile/${person.username || person._id}`}
              className="flex items-center gap-3 min-w-0 flex-1"
            >
              <Avatar src={person.profilePic} name={person.name} size="md" />
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{person.name}</p>
                {person.headline && (
                  <p className="text-xs text-gray-500 truncate max-w-[220px]">{person.headline}</p>
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
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
    </Card>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  const { data: postsData } = useQuery({
    queryKey: ['userPosts', data?.user?._id],
    queryFn: () => api.get(`/users/${data.user._id}/posts`).then((r) => r.data),
    enabled: !!data?.user?._id && activeTab === 'posts',
  });

  const { data: mutualData } = useQuery({
    queryKey: ['mutuals', data?.user?._id],
    queryFn: () => api.get(`/connections/mutual/${data.user._id}`).then((r) => r.data),
    enabled: !!data?.user?._id && data?.user?._id !== me?._id,
  });

  const profile = data?.user;
  const stats = statsData?.stats;
  const posts = postsData?.posts || [];
  const mutuals = mutualData?.mutuals || [];
  const isOwner = me?._id === profile?._id;
  const connectionCount = stats?.connectionCount ?? profile?.connections?.length ?? 0;

  // If route used a raw Mongo ObjectId, redirect to canonical username URL when available
  useEffect(() => {
    if (!isLoading && profile) {
      const isObjectId = /^[a-f\d]{24}$/i.test(id);
      if (isObjectId && profile.username && id !== profile.username) {
        navigate(`/profile/${profile.username}`, { replace: true });
      }
    }
  }, [isLoading, profile, id, navigate]);

  const handleShareProfile = () => {
    const url = `${window.location.origin}/profile/${profile.username || profile._id}`;
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied!');
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-[960px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            <div className="w-full lg:w-[280px] flex-shrink-0">
              <ProfileSidebarSkeleton />
            </div>
            <div className="flex-1 min-w-0">
              <ProfileContentSkeleton />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!profile)
    return (
      <MainLayout>
        <div className="text-center py-20 text-gray-400">Profile not found.</div>
      </MainLayout>
    );

  const tabs = [
    { key: 'about', label: 'About' },
    { key: 'posts', label: 'Posts' },
    { key: 'connections', label: 'Connections', count: connectionCount },
  ];

  return (
    <MainLayout>
      <div className="max-w-[960px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* LEFT: Profile summary card */}
          <div className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-4">
            <Card className="overflow-hidden">
              {/* Banner */}
              <div
                className="h-24 bg-primary-900 relative"
                style={{
                  backgroundImage: profile.bannerPic ? `url(${profile.bannerPic})` : undefined,
                  backgroundSize: 'cover',
                }}
              >
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                  <div className="ring-4 ring-white rounded-full">
                    <Avatar src={profile.profilePic} name={profile.name} size="xl" />
                  </div>
                </div>
              </div>

              <div className="pt-12 pb-5 px-5 text-center">
                <h2 className="font-bold text-gray-900 text-lg">{profile.name}</h2>
                {profile.username && <p className="text-xs text-gray-400">@{profile.username}</p>}
                <p className="text-sm text-gray-500 mt-0.5">{profile.headline}</p>
                {profile.location && (
                  <p className="flex items-center justify-center gap-1 text-xs text-gray-400 mt-1.5">
                    <MapPin size={12} /> {profile.location}
                  </p>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 text-xs text-primary mt-1 hover:underline"
                  >
                    <Globe size={11} /> Website
                  </a>
                )}

                <div className="border-t border-gray-100 mt-4 pt-4 flex justify-around">
                  <button onClick={() => setActiveTab('connections')} className="hover:opacity-80 transition-opacity">
                    <p className="font-bold text-gray-900">{connectionCount}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Connections</p>
                  </button>
                  <div className="w-px bg-gray-100" />
                  <div>
                    <p className="font-bold text-gray-900">{stats?.profileViews ?? 0}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Profile Views</p>
                  </div>
                  <div className="w-px bg-gray-100" />
                  <div>
                    <p className="font-bold text-gray-900">{stats?.postCount ?? 0}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Posts</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {isOwner ? (
                    <>
                      <Button
                        variant="primary"
                        fullWidth
                        size="sm"
                        className="flex items-center gap-2 justify-center"
                        onClick={() => navigate('/settings')}
                      >
                        <Edit2 size={14} /> Edit Profile
                      </Button>
                      <Button
                        variant="outline"
                        fullWidth
                        size="sm"
                        className="flex items-center gap-2 justify-center"
                        onClick={() => navigate('/activity')}
                      >
                        <BarChart2 size={14} /> View Analytics
                      </Button>
                    </>
                  ) : (
                    <ConnectionButton userId={profile._id} />
                  )}
                  <Button
                    variant="ghost"
                    fullWidth
                    size="sm"
                    className="flex items-center gap-2 justify-center"
                    onClick={handleShareProfile}
                  >
                    <Copy size={14} /> Share Profile
                  </Button>
                </div>
              </div>
            </Card>

            {/* Profile Completion (owner only) */}
            {isOwner && <ProfileCompletionCard profile={profile} />}

            {/* Mutual connections */}
            {!isOwner && mutuals.length > 0 && (
              <Card className="p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <Users size={12} className="inline mr-1" />
                  {mutualData?.count} Mutual Connection{mutualData?.count !== 1 ? 's' : ''}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mutuals.slice(0, 6).map((m) => (
                    <Link
                      key={m._id}
                      to={`/profile/${m.username || m._id}`}
                      className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-1.5 transition-colors"
                    >
                      <Avatar src={m.profilePic} name={m.name} size="xs" />
                      <span className="text-xs text-gray-700">{m.name}</span>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* Skill score */}
            {isOwner && stats?.skillScore > 0 && (
              <Card className="p-4 border-amber-200">
                <div className="flex items-center gap-2 mb-1">
                  <Award size={16} className="text-amber-500" />
                  <p className="text-sm font-semibold text-gray-800">Skill Score: {stats.skillScore}</p>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Your engagement-based ranking. Post, comment, and get likes to increase it.
                </p>
              </Card>
            )}

            {/* Profile Views Widget */}
            {isOwner && (
              <ProfileViewersWidget profile={profile} stats={stats} />
            )}
          </div>

          {/* RIGHT: Content sections */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
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

            {activeTab === 'about' && (
              <>
                <Card className="p-5">
                  <h3 className="font-bold text-gray-900 text-base mb-3">About</h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {profile.about || profile.bio || 'No bio added yet.'}
                  </p>
                </Card>

                {profile.interests?.length > 0 && (
                  <Card className="p-5">
                    <h3 className="font-bold text-gray-900 text-base mb-3">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest) => (
                        <span
                          key={interest}
                          className="text-xs px-3 py-1.5 bg-primary-50 text-primary rounded-full font-medium"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </Card>
                )}

                <ExperienceSection experiences={profile.experience || []} isOwner={isOwner} userId={profile._id} />
                <EducationSection educations={profile.education || []} isOwner={isOwner} userId={profile._id} />
                <SkillsSection skills={profile.skills || []} isOwner={isOwner} userId={profile._id} />
              </>
            )}

            {activeTab === 'posts' && (
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <Card className="text-center py-10 text-gray-400 text-sm">No posts yet.</Card>
                ) : (
                  posts.map((post) => <PostCard key={post._id} post={post} />)
                )}
              </div>
            )}

            {activeTab === 'connections' && (
              <ConnectionsTab profile={profile} isOwner={isOwner} />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
