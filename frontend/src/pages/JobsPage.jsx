import { useState } from "react";
import { Search, MapPin, Filter, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";
import MainLayout from "../components/layout/MainLayout";
import JobCard from "../components/jobs/JobCard";
import PostJobModal from "../components/jobs/PostJobModal";
import JobDetailModal from "../components/jobs/JobDetailModal";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const QUICK_FILTERS = [
  { label: "Remote", value: "remote" },
  { label: "Full-Time", value: "full-time" },
  { label: "Contract", value: "contract" },
  { label: "Internship", value: "internship" },
];

function JobsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-card shadow-card border border-surface-border p-5 animate-pulse">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [activeFilter, setActiveFilter] = useState(null);
  const [page, setPage] = useState(1);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", search, location, activeFilter, page],
    queryFn: () =>
      api.get("/jobs", {
        params: { search, location, type: activeFilter || undefined, page, limit: 8 },
      }).then((r) => r.data),
    keepPreviousData: true,
  });

  const jobs = data?.jobs || [];
  const totalPages = data?.pages || 1;

  return (
    <MainLayout>
      <div className="max-w-[960px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Opportunities</h1>
            <p className="text-sm text-gray-500 mt-1">
              Professional placements curated for the Graphite network.
            </p>
          </div>
          <Button size="sm" className="flex items-center gap-2" onClick={() => setShowPostModal(true)}>
            <Plus size={14} /> Post a Job
          </Button>
        </div>

        {/* Search bar */}
        <Card className="p-4 mb-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search roles, industries, or keywords"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary"
              />
            </div>
            <div className="relative">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={location}
                onChange={(e) => { setLocation(e.target.value); setPage(1); }}
                placeholder="Location"
                className="w-48 pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary"
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => { setPage(1); }}
            >
              Search
            </Button>
          </div>

          {/* Quick filters */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setActiveFilter(activeFilter === f.value ? null : f.value);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${activeFilter === f.value
                    ? "bg-primary text-white border-primary"
                    : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                  }`}
              >
                {f.label}
              </button>
            ))}
            {activeFilter && (
              <button
                onClick={() => { setActiveFilter(null); setPage(1); }}
                className="px-3 py-1 rounded-full text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </Card>

        {/* Results */}
        {isLoading ? (
          <JobsSkeleton />
        ) : jobs.length === 0 ? (
          <Card className="text-center py-16">
            <p className="font-semibold text-gray-600 mb-1">No jobs found</p>
            <p className="text-sm text-gray-400">
              Try adjusting your search or filters
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="cursor-pointer"
                onClick={() => setSelectedJobId(job._id)}
              >
                <JobCard job={job} />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showPostModal && <PostJobModal onClose={() => setShowPostModal(false)} />}
      {selectedJobId && (
        <JobDetailModal jobId={selectedJobId} onClose={() => setSelectedJobId(null)} />
      )}
    </MainLayout>
  );
}