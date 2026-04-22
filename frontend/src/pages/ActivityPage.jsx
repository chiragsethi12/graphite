import { useQuery } from "@tanstack/react-query";
import { BarChart2, Eye, Users, FileText, TrendingUp, Award, ArrowUpRight } from "lucide-react";
import api from "../lib/axios";
import MainLayout from "../components/layout/MainLayout";
import Card from "../components/ui/Card";

function StatCard({ icon: Icon, label, value, subtitle, color = "text-primary" }) {
  return (
    <Card className="p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} bg-opacity-10`}
        style={{ backgroundColor: `currentColor`, opacity: 0.1 }}>
        <Icon size={18} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-2xl text-gray-900">{value}</p>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </Card>
  );
}

function EngagementBar({ label, value, max }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-gray-500 w-20 shrink-0">{label}</p>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <p className="text-xs font-semibold text-gray-700 w-10 text-right">{value}</p>
    </div>
  );
}

function TopPostCard({ post, index }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="w-6 h-6 rounded-full bg-primary-50 text-primary flex items-center justify-center text-xs font-bold shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
        <div className="flex gap-4 mt-1 text-xs text-gray-400">
          <span>♥ {post.likes}</span>
          <span>💬 {post.comments}</span>
          <span>🔄 {post.shares}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs font-semibold text-primary shrink-0">
        <TrendingUp size={12} /> {post.engagementScore}
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => api.get("/analytics/me").then((r) => r.data),
  });

  const analytics = data?.analytics;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-[760px] mx-auto space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-card animate-pulse" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!analytics) {
    return (
      <MainLayout>
        <div className="max-w-[760px] mx-auto">
          <Card className="text-center py-16 text-gray-400">
            <BarChart2 size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No analytics data yet</p>
            <p className="text-sm mt-1">Start posting and connecting to see your stats</p>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const { engagement, last30Days, topPosts, skillStats } = analytics;
  const maxEngagement = Math.max(engagement.totalLikes, engagement.totalComments, engagement.totalShares, 1);

  return (
    <MainLayout>
      <div className="max-w-[760px] mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Activity Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your professional engagement overview</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Eye}       label="Profile Views"  value={analytics.profileViews}    color="text-blue-500" />
          <StatCard icon={Users}     label="Connections"     value={analytics.connectionCount} color="text-green-500" />
          <StatCard icon={FileText}  label="Posts"           value={analytics.postCount}       color="text-purple-500" />
          <StatCard icon={Award}     label="Skill Score"     value={analytics.skillScore}      color="text-amber-500"
            subtitle="Engagement-based ranking" />
        </div>

        {/* Last 30 days */}
        <Card className="p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ArrowUpRight size={16} className="text-primary" /> Last 30 Days
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{last30Days.newConnections}</p>
              <p className="text-xs text-green-700 font-medium">New Connections</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{last30Days.notifications}</p>
              <p className="text-xs text-blue-700 font-medium">Notifications Received</p>
            </div>
          </div>
        </Card>

        {/* Engagement breakdown */}
        <Card className="p-5">
          <h3 className="font-bold text-gray-900 mb-4">Engagement Breakdown</h3>
          <div className="space-y-3">
            <EngagementBar label="Likes"    value={engagement.totalLikes}    max={maxEngagement} />
            <EngagementBar label="Comments" value={engagement.totalComments} max={maxEngagement} />
            <EngagementBar label="Shares"   value={engagement.totalShares}   max={maxEngagement} />
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">
              Average engagement per post: <span className="font-bold text-gray-900">{engagement.avgEngagementPerPost}</span>
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top posts */}
          {topPosts?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-bold text-gray-900 mb-3">Top Performing Posts</h3>
              <div className="space-y-1">
                {topPosts.map((post, i) => (
                  <TopPostCard key={post._id} post={post} index={i} />
                ))}
              </div>
            </Card>
          )}

          {/* Skill stats */}
          {skillStats?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-bold text-gray-900 mb-3">Your Skills Network</h3>
              <div className="space-y-2">
                {skillStats.map(({ skill, usersWithSkill }) => (
                  <div key={skill} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <span className="text-sm font-medium text-gray-700">{skill}</span>
                    <span className="text-xs text-gray-400">{usersWithSkill} professionals</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
