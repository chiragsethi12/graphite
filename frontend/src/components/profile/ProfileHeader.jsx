import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Globe, Edit2, Plus, Sparkles, BarChart2, Copy,
  Briefcase, GraduationCap, Mail, UserPlus, UserMinus, Clock, CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import useConnectionStatus from '../../hooks/useConnectionStatus';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import ConfirmAction from '../ui/ConfirmDialog';
import toast from 'react-hot-toast';

/* ─── Connection Action Buttons ────────────────────────────────── */

function ConnectionActions({ userId }) {
  const { status, sendRequest, withdraw, respond, remove } = useConnectionStatus(userId);

  if (status === 'self') return null;

  if (status === 'connected') {
    return (
      <ConfirmAction onConfirm={() => remove.mutate()} message="Remove connection?" confirmLabel="Remove">
        {(ask) => (
          <button onClick={ask} className="inline-flex items-center gap-2 px-5 py-2 rounded-full border-2 border-primary text-primary text-sm font-semibold hover:bg-primary-50 transition-all">
            <CheckCircle size={16} /> Connected
          </button>
        )}
      </ConfirmAction>
    );
  }

  if (status === 'pending_sent') {
    return (
      <ConfirmAction onConfirm={() => withdraw.mutate()} message="Withdraw request?" confirmLabel="Withdraw" variant="warning">
        {(ask) => (
          <button onClick={ask} className="inline-flex items-center gap-2 px-5 py-2 rounded-full border-2 border-gray-300 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-all">
            <Clock size={16} /> Pending
          </button>
        )}
      </ConfirmAction>
    );
  }

  if (status === 'pending_received') {
    return (
      <div className="flex gap-2">
        <button onClick={() => respond.mutate('accept')} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-950 transition-all">
          Accept
        </button>
        <button onClick={() => respond.mutate('reject')} className="inline-flex items-center gap-2 px-5 py-2 rounded-full border-2 border-gray-300 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-all">
          Decline
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => sendRequest.mutate()}
      disabled={sendRequest.isPending}
      className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-950 transition-all shadow-sm disabled:opacity-50"
    >
      <UserPlus size={16} /> Connect
    </button>
  );
}

/* ─── Profile Header Hero ──────────────────────────────────────── */

export default function ProfileHeader({ profile, stats, isOwner }) {
  const navigate = useNavigate();
  const [bannerError, setBannerError] = useState(false);
  const connectionCount = stats?.connectionCount ?? profile?.connections?.length ?? 0;

  // Derive the first current experience and education for the right summary
  const currentRole = profile.experience?.find((e) => e.current || !e.endDate || e.endDate === 'Present');
  const firstEdu = profile.education?.[0];

  const handleShareProfile = () => {
    const url = `${window.location.origin}/profile/${profile.username || profile._id}`;
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied!');
  };

  const showBannerImage = profile.bannerPic && !bannerError;

  return (
    <div className="bg-white rounded-2xl shadow-card border border-surface-border overflow-hidden">
      {/* ── Banner ──────────────────────────────────────────── */}
      <div className="h-44 md:h-52 relative overflow-hidden">
        {/* Gradient fallback — always rendered behind the image */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #660033 0%, #4d0026 40%, #330019 100%)' }}
        />
        {/* User banner image — covers the gradient when valid */}
        {showBannerImage && (
          <img
            src={profile.bannerPic}
            alt=""
            onError={() => setBannerError(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-[0.08]"
          />
        )}
        {/* Burgundy tinted overlay — dims any image to a subtle background */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(102,0,51,0.85) 0%, rgba(77,0,38,0.75) 50%, rgba(51,0,25,0.85) 100%)' }} />

        {/* Edit banner (owner only) */}
        {isOwner && (
          <button
            onClick={() => navigate('/settings')}
            className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-lg text-gray-600 hover:bg-white hover:text-primary transition-all shadow-sm"
          >
            <Edit2 size={15} />
          </button>
        )}
      </div>

      {/* ── Profile Info ───────────────────────────────────── */}
      <div className="px-6 md:px-8 pb-6">
        {/* Avatar — overlaps banner */}
        <div className="-mt-16 md:-mt-20 mb-3 relative z-10">
          <div className="w-32 h-32 rounded-full ring-4 ring-white shadow-lg bg-white overflow-hidden flex items-center justify-center">
            {profile.profilePic ? (
              <img
                src={profile.profilePic}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-semibold text-primary">
                {profile.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'}
              </span>
            )}
          </div>
        </div>

        {/* Identity + Affiliations side by side on desktop */}
        <div className="flex flex-col lg:flex-row lg:justify-between gap-3">
          {/* Left: identity */}
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] md:text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">
              {profile.name}
            </h1>

            {profile.headline && (
              <p className="text-[14px] text-gray-600 mt-0.5 leading-snug max-w-md">
                {profile.headline}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              {profile.location && (
                <span className="flex items-center gap-1 text-[13px] text-gray-400">
                  <MapPin size={13} /> {profile.location}
                </span>
              )}
              <button className="flex items-center gap-1 text-[13px] text-primary font-medium hover:underline">
                <Mail size={13} /> Contact info
              </button>
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[13px] text-primary hover:underline"
                >
                  <Globe size={13} /> Website
                </a>
              )}
            </div>

            {/* Connections count */}
            <p className="mt-1.5 text-[13px] text-primary font-semibold hover:underline cursor-pointer">
              {connectionCount} connection{connectionCount !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Right: Affiliations summary */}
          <div className="flex flex-col gap-2 lg:items-end flex-shrink-0 mt-1 lg:mt-0">
            {currentRole && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                  <Briefcase size={15} className="text-gray-400" />
                </div>
                <div className="lg:text-right">
                  <p className="text-[13px] font-medium text-gray-700 leading-snug">{currentRole.company}</p>
                </div>
              </div>
            )}
            {firstEdu && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                  <GraduationCap size={15} className="text-gray-400" />
                </div>
                <div className="lg:text-right">
                  <p className="text-[13px] font-medium text-gray-700 leading-snug">{firstEdu.school}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Action Buttons ──────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2.5 mt-4 pt-4 border-t border-gray-100">
              {isOwner ? (
                <>
                  <button
                    onClick={() => navigate('/settings')}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-950 transition-all shadow-sm"
                  >
                    <Edit2 size={14} /> Edit Profile
                  </button>
                  <button
                    onClick={() => navigate('/activity')}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full border-2 border-primary text-primary text-sm font-semibold hover:bg-primary-50 transition-all"
                  >
                    <BarChart2 size={14} /> Analytics
                  </button>
                  <button
                    onClick={handleShareProfile}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all"
                  >
                    <Copy size={14} /> Share
                  </button>
                </>
              ) : (
                <>
                  <ConnectionActions userId={profile._id} />
                  <button
                    onClick={handleShareProfile}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all"
                  >
                    <Copy size={14} /> Share
                  </button>
                </>
              )}
        </div>
      </div>
    </div>
  );
}
