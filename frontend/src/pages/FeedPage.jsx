import { useState, useCallback } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import api from "../lib/axios";
import MainLayout from "../components/layout/MainLayout";
import CreatePost from "../components/feed/CreatePost";
import PostCard from "../components/feed/PostCard";
import TrendingInsights from "../components/feed/TrendingInsights";
import NetworkSuggestions from "../components/feed/NetworkSuggestions";
import Card from "../components/ui/Card";
import useInfiniteScroll from "../hooks/useInfiniteScroll";

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-card shadow-card border border-surface-border p-4 animate-pulse">
          <div className="flex gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-2 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
          </div>
          <div className="h-40 bg-gray-200 rounded-lg mt-3" />
        </div>
      ))}
    </div>
  );
}

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
          <FeedSkeleton />
        ) : allPosts.length === 0 ? (
          <Card className="text-center py-12 text-gray-400">
            <p className="text-base font-medium mb-1">Your feed is empty</p>
            <p className="text-sm">Connect with professionals to see their posts here.</p>
          </Card>
        ) : (
          <>
            {allPosts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" />

            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!hasNextPage && allPosts.length > 0 && (
              <p className="text-center text-xs text-gray-400 py-4">You've reached the end</p>
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
                      <span>♥ {post.likes?.length || 0}</span>
                      <span>💬 {post.comments?.length || 0}</span>
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
