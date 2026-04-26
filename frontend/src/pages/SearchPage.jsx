import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Search, MapPin, Briefcase, Filter, X, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";
import MainLayout from "../components/layout/MainLayout";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import toast from "react-hot-toast";

const TABS = [
  { key: "users", label: "People" },
  { key: "jobs",  label: "Jobs" },
  { key: "posts", label: "Posts" },
];

function UserCard({ user }) {
  return (
    <Link
      to={`/profile/${user.username || user._id}`}
      className="bg-white rounded-card shadow-card border border-surface-border p-4 flex items-start gap-4 hover:shadow-card-hover transition-shadow"
    >
      <Avatar src={user.profilePic} name={user.name} size="lg" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
        <p className="text-xs text-gray-500 truncate">{user.headline}</p>
        {user.location && (
          <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
            <MapPin size={11} /> {user.location}
          </p>
        )}
        {user.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {user.skills.slice(0, 4).map((s) => (
              <span key={s} className="text-[10px] px-2 py-0.5 bg-primary-50 text-primary rounded-full font-medium">{s}</span>
            ))}
          </div>
        )}
      </div>
      {user.connectionStatus === "connected" && (
        <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-semibold shrink-0">Connected</span>
      )}
      {user.connectionStatus === "pending_sent" && (
        <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-semibold shrink-0">Pending</span>
      )}
    </Link>
  );
}

function JobCard({ job }) {
  return (
    <Link
      to={`/jobs?id=${job._id}`}
      className="bg-white rounded-card shadow-card border border-surface-border p-4 hover:shadow-card-hover transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary font-bold text-sm">
          {job.company?.charAt(0)}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900">{job.title}</p>
          <p className="text-xs text-gray-500">{job.company}</p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
            {job.location && <span className="flex items-center gap-0.5"><MapPin size={10} /> {job.location}</span>}
            <span className="capitalize">{job.type}</span>
            {job.experienceLevel && job.experienceLevel !== "any" && (
              <span className="capitalize">{job.experienceLevel}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function PostResult({ post }) {
  return (
    <div className="bg-white rounded-card shadow-card border border-surface-border p-4 hover:shadow-card-hover transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <Avatar src={post.author?.profilePic} name={post.author?.name} size="sm" />
        <div>
          <p className="text-xs font-semibold text-gray-900">{post.author?.name}</p>
          <p className="text-[10px] text-gray-400">{post.author?.headline}</p>
        </div>
      </div>
      <p className="text-sm text-gray-700 line-clamp-3">{post.content}</p>
      {post.tags?.length > 0 && (
        <div className="flex gap-1 mt-2">
          {post.tags.slice(0, 3).map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">#{t}</span>
          ))}
        </div>
      )}
      <div className="flex gap-4 mt-2 text-xs text-gray-400">
        <span>♥ {post.likesCount || 0}</span>
        <span>💬 {post.commentsCount || 0}</span>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("users");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ skills: "", location: "", company: "" });

  const searchQuery = searchParams.get("q") || "";

  // Dropdown states
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const suggestionsRef = useRef(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["search", searchQuery, activeTab, filters],
    queryFn: () => {
      const params = new URLSearchParams({ q: searchQuery, type: activeTab });
      if (filters.skills)   params.set("skills", filters.skills);
      if (filters.location) params.set("location", filters.location);
      if (filters.company)  params.set("company", filters.company);
      return api.get(`/search?${params}`).then((r) => r.data);
    },
    enabled: searchQuery.length >= 2,
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch live suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2 && query !== searchQuery) {
        setSuggestionsLoading(true);
        setSuggestionsOpen(true);
        try {
          const res = await api.get(`/search?q=${encodeURIComponent(query.trim())}&type=users`);
          setSuggestions((res.data?.users || []).slice(0, 6));
        } catch (error) {
          setSuggestions([]);
        } finally {
          setSuggestionsLoading(false);
        }
      } else {
        setSuggestionsOpen(false);
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim().length < 2) return toast.error("Enter at least 2 characters");
    setSuggestionsOpen(false);
    setSearchParams({ q: query.trim() });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setSuggestionsOpen(false);
    }
  };

  const clearFilters = () => setFilters({ skills: "", location: "", company: "" });

  const users = data?.users || [];
  const jobs  = data?.jobs  || [];
  const posts = data?.posts || [];

  const resultMap = { users, jobs, posts };
  const results   = resultMap[activeTab] || [];

  // Highlight matched text in name
  const highlightMatch = (text, matchStr) => {
    if (!matchStr || !text) return text;
    const regex = new RegExp(`(${matchStr})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-primary-50 text-primary font-semibold not-italic">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <MainLayout>
      <div className="max-w-[720px] mx-auto space-y-4">
        {/* Search bar wrapper with ref */}
        <div ref={suggestionsRef} className="relative">
          <form onSubmit={handleSearch} className="relative z-10">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (query.trim().length >= 2 && query !== searchQuery) setSuggestionsOpen(true); }}
              placeholder="Search people, jobs, posts..."
              className="w-full pl-11 pr-28 py-3 text-sm bg-white border border-surface-border rounded-card shadow-card focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters((p) => !p)}
                className="flex items-center gap-1"
              >
                <Filter size={14} /> Filters
              </Button>
              <Button type="submit" variant="primary" size="sm">Search</Button>
            </div>
          </form>

          {/* Live search suggestions dropdown */}
          {suggestionsOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-card-hover border border-surface-border z-50 max-h-[320px] overflow-y-auto">
              {suggestionsLoading ? (
                <div className="py-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse h-12 bg-gray-100 rounded-lg mx-3 my-1" />
                  ))}
                </div>
              ) : suggestions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400">
                  No users found for '{query}'
                </div>
              ) : (
                <div className="py-2">
                  {suggestions.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => {
                        navigate(`/profile/${user.username || user._id}`);
                        setQuery(user.name);
                        setSuggestionsOpen(false);
                      }}
                      className="flex items-center justify-between hover:bg-gray-50 cursor-pointer px-4 py-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar src={user.profilePic} name={user.name} size="sm" />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate flex items-center gap-1">
                            {highlightMatch(user.name, query.trim())}
                            {user.username && (
                              <span className="text-xs text-gray-400 font-normal">@{user.username}</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.headline}</p>
                        </div>
                      </div>
                      {user.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0 ml-3">
                          <MapPin size={10} /> {user.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filters panel */}
        {showFilters && (
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm text-gray-900">Filters</h3>
              <button onClick={clearFilters} className="text-xs text-primary hover:underline">Clear all</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Skills</label>
                <input
                  value={filters.skills}
                  onChange={(e) => setFilters((f) => ({ ...f, skills: e.target.value }))}
                  placeholder="React, Node.js..."
                  className="input-base"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Location</label>
                <input
                  value={filters.location}
                  onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
                  placeholder="New York, Remote..."
                  className="input-base"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Company</label>
                <input
                  value={filters.company}
                  onChange={(e) => setFilters((f) => ({ ...f, company: e.target.value }))}
                  placeholder="Google, Meta..."
                  className="input-base"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Tabs */}
        {searchQuery && (
          <div className="flex gap-1 border-b border-gray-200">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
                {resultMap[key]?.length > 0 && (
                  <span className="ml-1.5 text-xs text-gray-400">({resultMap[key].length})</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-card shadow-card border border-surface-border h-20 animate-pulse" />
            ))}
          </div>
        ) : searchQuery && results.length === 0 ? (
          <Card className="text-center py-12 text-gray-400">
            <Search size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No {activeTab} found for "{searchQuery}"</p>
            <p className="text-xs mt-1">Try different keywords or adjust your filters</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeTab === "users" && users.map((u) => <UserCard key={u._id} user={u} />)}
            {activeTab === "jobs"  && jobs.map((j)  => <JobCard key={j._id} job={j} />)}
            {activeTab === "posts" && posts.map((p) => <PostResult key={p._id} post={p} />)}
          </div>
        )}

        {!searchQuery && (
          <Card className="text-center py-16 text-gray-400">
            <Search size={40} className="mx-auto mb-4 text-gray-300" />
            <p className="font-semibold text-gray-900 text-base">Search the Graphite network</p>
            <p className="text-sm mt-1">Find people, jobs, and posts across the platform</p>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
