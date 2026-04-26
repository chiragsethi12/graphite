import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
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
          <Card className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-primary-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Your feed is empty.</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              Connect with people to see their posts here. Building your network is the best way to get value from Graphite.
            </p>
            <Link
              to="/network"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-950 transition-colors shadow-sm"
            >
              Go to Network
            </Link>
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
