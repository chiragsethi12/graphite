import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Globe, Eye, Users, Award, ExternalLink, Copy } from 'lucide-react';
import api from '../../lib/axios';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

/* ─── Sidebar widget card ──────────────────────────────────────── */
function SidebarCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-surface-border p-5">
      {title && (
        <div className="flex items-center gap-2 mb-3.5 pb-3 border-b border-gray-100">
          {Icon && <Icon size={15} className="text-gray-400" />}
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}

/* ─── Profile Viewers Widget ───────────────────────────────────── */
function ProfileViewersWidget({ profile, stats }) {
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
    <SidebarCard title="Who viewed your profile" icon={Eye}>
      {/* Avatar stack */}
      {recentViewers.length > 0 && (
        <div className="flex -space-x-2 overflow-hidden mb-3">
          {recentViewers.map((view, i) => (
            view.viewerId && (
              <Link
                key={i}
                to={`/profile/${view.viewerId.username || view.viewerId._id}`}
                className="inline-block ring-2 ring-white rounded-full hover:z-10 transition-transform hover:scale-110"
              >
                <Avatar src={view.viewerId.profilePic} name={view.viewerId.name} size="sm" />
              </Link>
            )
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500 leading-relaxed">
        {latestViewer && (
          <>
            <Link
              to={`/profile/${latestViewer.username || latestViewer._id}`}
              className="font-semibold text-gray-700 hover:text-primary transition-colors"
            >
              {latestViewer.name}
            </Link>
            {othersCount > 0 && (
              <span> and <span className="font-semibold text-gray-700">{othersCount} other{othersCount !== 1 ? 's' : ''}</span></span>
            )}
          </>
        )}
        {weeklyViews.length > 0 && (
          <span className="text-gray-400 block mt-1">📊 {weeklyViews.length} view{weeklyViews.length !== 1 ? 's' : ''} this week</span>
        )}
      </p>
    </SidebarCard>
  );
}

/* ─── Public Profile URL Widget ────────────────────────────────── */
function PublicProfileWidget({ profile }) {
  const url = `${window.location.origin}/profile/${profile.username || profile._id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    toast.success('Profile URL copied!');
  };

  return (
    <SidebarCard title="Public profile & URL" icon={Globe}>
      <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
        <p className="text-xs text-gray-500 truncate flex-1 font-mono">
          {url.replace('https://', '').replace('http://', '')}
        </p>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-white transition-all flex-shrink-0"
        >
          <Copy size={13} />
        </button>
      </div>
    </SidebarCard>
  );
}

/* ─── People Also Viewed ───────────────────────────────────────── */
function PeopleAlsoViewed({ userId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => api.get('/users/suggestions').then((r) => r.data),
  });

  const suggestions = data?.users?.slice(0, 4) || [];

  if (isLoading || suggestions.length === 0) return null;

  return (
    <SidebarCard title="People also viewed" icon={Users}>
      <div className="space-y-3">
        {suggestions.map((person) => (
          <Link
            key={person._id}
            to={`/profile/${person.username || person._id}`}
            className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-gray-50 transition-colors group"
          >
            <Avatar src={person.profilePic} name={person.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-primary transition-colors">
                {person.name}
              </p>
              <p className="text-xs text-gray-400 truncate">{person.headline}</p>
            </div>
            <ExternalLink size={12} className="text-gray-300 group-hover:text-primary transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
    </SidebarCard>
  );
}

/* ─── Skill Score Widget ───────────────────────────────────────── */
function SkillScoreWidget({ stats }) {
  if (!stats?.skillScore || stats.skillScore <= 0) return null;

  return (
    <SidebarCard title="Skill Score" icon={Award}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
          <span className="text-xl font-extrabold text-amber-600">{stats.skillScore}</span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Your engagement-based ranking. Post, comment, and get endorsed to increase it.
        </p>
      </div>
    </SidebarCard>
  );
}

/* ─── Profile Completion (imported from existing) ──────────────── */
import ProfileCompletionCard from './ProfileCompletionCard';

/* ─── Main Sidebar Component ──────────────────────────────────── */
export default function ProfileSidebar({ profile, stats, isOwner, mutuals, mutualCount }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Profile Completion (owner only) */}
      {isOwner && <ProfileCompletionCard profile={profile} />}

      {/* Profile Viewers (owner only) */}
      {isOwner && <ProfileViewersWidget profile={profile} stats={stats} />}

      {/* Skill Score (owner only) */}
      {isOwner && <SkillScoreWidget stats={stats} />}

      {/* Public Profile URL */}
      <PublicProfileWidget profile={profile} />

      {/* Mutual connections (for other users) */}
      {!isOwner && mutuals?.length > 0 && (
        <SidebarCard title={`${mutualCount || mutuals.length} Mutual Connection${(mutualCount || mutuals.length) !== 1 ? 's' : ''}`} icon={Users}>
          <div className="space-y-2">
            {mutuals.slice(0, 5).map((m) => (
              <Link
                key={m._id}
                to={`/profile/${m.username || m._id}`}
                className="flex items-center gap-2.5 p-1.5 -mx-1 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Avatar src={m.profilePic} name={m.name} size="xs" />
                <span className="text-xs text-gray-700 font-medium">{m.name}</span>
              </Link>
            ))}
          </div>
        </SidebarCard>
      )}

      {/* People Also Viewed */}
      <PeopleAlsoViewed userId={profile._id} />
    </div>
  );
}
