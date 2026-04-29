import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { Users, Sparkles, ArrowRight } from "lucide-react";
import api from "../lib/axios";
import MainLayout from "../components/layout/MainLayout";
import CreatePost from "../components/feed/CreatePost";
import PostCard from "../components/feed/PostCard";
import TrendingInsights from "../components/feed/TrendingInsights";
import NetworkSuggestions from "../components/feed/NetworkSuggestions";
import Card from "../components/ui/Card";
import { FeedSkeleton } from "../components/ui/SkeletonScreens";
import useInfiniteScroll from "../hooks/useInfiniteScroll";

export default function FeedPage() {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: "10" });
      if (pageParam) params.set("cursor", pageParam);
      return api.get(`/posts/feed?${params}`).then((r) => r.data);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null,
  });

  const { data: suggestionsData } = useQuery({
    queryKey: ["suggestions"],
    queryFn: () => api.get("/users/suggestions").then((r) => r.data),
  });

  const { data: trendingData } = useQuery({
    queryKey: ["trending"],
    queryFn: () => api.get("/posts/trending").then((r) => r.data),
  });

  const allPosts    = data?.pages?.flatMap((p) => p.posts) || [];
  const suggestions = suggestionsData?.users || [];
  const trending    = trendingData?.posts || [];

  const sentinelRef = useInfiniteScroll(
    () => fetchNextPage(),
    !!hasNextPage,
    isFetchingNextPage
  );

  return (
    <MainLayout>
      <div className="max-w-[680px] mx-auto space-y-4">
        <CreatePost />

        {isLoading ? (
          <FeedSkeleton count={3} />
        ) : allPosts.length === 0 ? (
          /* ─── Empty Feed Onboarding ─────────────────────────── */
          <Card className="text-center py-16 px-6 relative overflow-hidden">
            {/* Subtle decorative gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-transparent to-primary-50/30 pointer-events-none" />

            <div className="relative z-10">
              <div className="w-20 h-20 bg-primary-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-5 rotate-3 shadow-sm">
                <Users size={36} strokeWidth={1.5} />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Your feed is empty
              </h3>
              <p className="text-sm text-gray-500 mb-2 max-w-sm mx-auto leading-relaxed">
                Connect with people to see their posts here. Building your
                network is the best way to get value from Graphite.
              </p>
              <p className="text-xs text-gray-400 mb-6 flex items-center justify-center gap-1">
                <Sparkles size={12} />
                Start by connecting with people you know
              </p>

              <Link
                to="/network"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-950 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Go to Network
                <ArrowRight size={16} />
              </Link>
            </div>
          </Card>
        ) : (
          <>
            {allPosts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" />

            {isFetchingNextPage && (
              <div className="flex justify-center py-6">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-gray-400 font-medium">Loading more posts…</span>
                </div>
              </div>
            )}

            {!hasNextPage && allPosts.length > 0 && (
              <div className="text-center py-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                  <p className="text-xs text-gray-400 font-medium">You've reached the end</p>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                </div>
              </div>
            )}
          </>
        )}

        {/* Trending posts */}
        {trending.length > 0 && (
          <Card className="p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-3">🔥 Trending on Graphite</h3>
            <div className="space-y-3">
              {trending.slice(0, 5).map((post) => (
                <div key={post._id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800">{post.author?.name}</p>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{post.content}</p>
                    <div className="flex gap-3 mt-1 text-[10px] text-gray-400">
                      <span>♥ {post.likesCount || 0}</span>
                      <span>💬 {post.commentsCount || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {suggestions.length > 0 && <NetworkSuggestions suggestions={suggestions} />}
      </div>
    </MainLayout>
  );
}
