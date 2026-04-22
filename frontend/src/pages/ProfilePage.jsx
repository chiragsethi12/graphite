import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MapPin, Edit2, BarChart2, Award, Users, Share2, Globe, Copy } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import useConnectionStatus from "../hooks/useConnectionStatus";
import MainLayout from "../components/layout/MainLayout";
import ExperienceSection from "../components/profile/ExperienceSection";
import EducationSection from "../components/profile/EducationSection";
import SkillsSection from "../components/profile/SkillsSection";
import PostCard from "../components/feed/PostCard";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import toast from "react-hot-toast";

function ConnectionButton({ userId }) {
  const { status, sendRequest, withdraw, respond, remove } = useConnectionStatus(userId);

  if (status === "self") return null;

  if (status === "connected") {
    return (
      <Button variant="outline" fullWidth size="sm" onClick={() => {
        if (confirm("Remove this connection?")) remove.mutate();
      }}>
        ✓ Connected
      </Button>
    );
  }

  if (status === "pending_sent") {
    return (
      <Button variant="ghost" fullWidth size="sm" onClick={() => withdraw.mutate()}>
        Pending · Withdraw
      </Button>
    );
  }

  if (status === "pending_received") {
    return (
      <div className="flex gap-2">
        <Button variant="primary" size="sm" className="flex-1" onClick={() => respond.mutate("accept")}>Accept</Button>
        <Button variant="ghost" size="sm" className="flex-1" onClick={() => respond.mutate("reject")}>Decline</Button>
      </div>
    );
  }

  return (
    <Button variant="primary" fullWidth size="sm" onClick={() => sendRequest.mutate()} loading={sendRequest.isPending}>
      Connect
    </Button>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("about");

  const { data, isLoading } = useQuery({
    queryKey: ["profile", id],
    queryFn: () => api.get(`/users/${id}`).then((r) => r.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ["userStats", data?.user?._id],
    queryFn: () => api.get(`/users/${data.user._id}/stats`).then((r) => r.data),
    enabled: !!data?.user?._id,
  });

  const { data: postsData } = useQuery({
    queryKey: ["userPosts", data?.user?._id],
    queryFn: () => api.get(`/users/${data.user._id}/posts`).then((r) => r.data),
    enabled: !!data?.user?._id && activeTab === "posts",
  });

  const { data: mutualData } = useQuery({
    queryKey: ["mutuals", data?.user?._id],
    queryFn: () => api.get(`/connections/mutual/${data.user._id}`).then((r) => r.data),
    enabled: !!data?.user?._id && data?.user?._id !== me?._id,
  });

  const profile = data?.user;
  const stats   = statsData?.stats;
  const posts   = postsData?.posts || [];
  const mutuals = mutualData?.mutuals || [];
  const isOwner = me?._id === profile?._id;

  const handleShareProfile = () => {
    const url = `${window.location.origin}/profile/${profile.username || profile._id}`;
    navigator.clipboard.writeText(url);
    toast.success("Profile link copied!");
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-[960px] mx-auto animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-card" />
          <div className="flex gap-4">
            <div className="w-1/3 h-64 bg-gray-200 rounded-card" />
            <div className="flex-1 h-64 bg-gray-200 rounded-card" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!profile) return (
    <MainLayout>
      <div className="text-center py-20 text-gray-400">Profile not found.</div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="max-w-[960px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* LEFT: Profile summary card */}
          <div className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-4">
            <Card className="overflow-hidden">
              {/* Banner */}
              <div className="h-24 bg-primary-900 relative" style={{ backgroundImage: profile.bannerPic ? `url(${profile.bannerPic})` : undefined, backgroundSize: "cover" }}>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                  <div className="ring-4 ring-white rounded-full">
                    <Avatar src={profile.profilePic} name={profile.name} size="xl" />
                  </div>
                </div>
              </div>

              <div className="pt-12 pb-5 px-5 text-center">
                <h2 className="font-bold text-gray-900 text-lg">{profile.name}</h2>
                {profile.username && (
                  <p className="text-xs text-gray-400">@{profile.username}</p>
                )}
                <p className="text-sm text-gray-500 mt-0.5">{profile.headline}</p>
                {profile.location && (
                  <p className="flex items-center justify-center gap-1 text-xs text-gray-400 mt-1.5">
                    <MapPin size={12} /> {profile.location}
                  </p>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 text-xs text-primary mt-1 hover:underline">
                    <Globe size={11} /> Website
                  </a>
                )}

                <div className="border-t border-gray-100 mt-4 pt-4 flex justify-around">
                  <div>
                    <p className="font-bold text-gray-900">{stats?.connectionCount ?? profile.connections?.length ?? 0}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Connections</p>
                  </div>
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
                      <Button variant="primary" fullWidth size="sm" className="flex items-center gap-2 justify-center"
                        onClick={() => navigate("/settings")}>
                        <Edit2 size={14} /> Edit Profile
                      </Button>
                      <Button variant="outline" fullWidth size="sm" className="flex items-center gap-2 justify-center"
                        onClick={() => navigate("/activity")}>
                        <BarChart2 size={14} /> View Analytics
                      </Button>
                    </>
                  ) : (
                    <ConnectionButton userId={profile._id} />
                  )}
                  <Button variant="ghost" fullWidth size="sm" className="flex items-center gap-2 justify-center"
                    onClick={handleShareProfile}>
                    <Copy size={14} /> Share Profile
                  </Button>
                </div>
              </div>
            </Card>

            {/* Mutual connections */}
            {!isOwner && mutuals.length > 0 && (
              <Card className="p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <Users size={12} className="inline mr-1" />
                  {mutualData?.count} Mutual Connection{mutualData?.count !== 1 ? "s" : ""}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mutuals.slice(0, 6).map((m) => (
                    <Link key={m._id} to={`/profile/${m.username || m._id}`} className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-1.5 transition-colors">
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
          </div>

          {/* RIGHT: Content sections */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200">
              {["about", "posts"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                    activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "about" && (
              <>
                <Card className="p-5">
                  <h3 className="font-bold text-gray-900 text-base mb-3">About</h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {profile.bio || "No bio added yet."}
                  </p>
                </Card>

                {profile.interests?.length > 0 && (
                  <Card className="p-5">
                    <h3 className="font-bold text-gray-900 text-base mb-3">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest) => (
                        <span key={interest} className="text-xs px-3 py-1.5 bg-primary-50 text-primary rounded-full font-medium">
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

            {activeTab === "posts" && (
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <Card className="text-center py-10 text-gray-400 text-sm">
                    No posts yet.
                  </Card>
                ) : (
                  posts.map((post) => <PostCard key={post._id} post={post} />)
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
