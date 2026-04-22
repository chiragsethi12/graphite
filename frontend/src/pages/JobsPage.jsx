import { useState } from "react";
import { Search, MapPin, Filter, Plus, BellPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";
import MainLayout from "../components/layout/MainLayout";
import JobCard from "../components/jobs/JobCard";
import Button from "../components/ui/Button";

const QUICK_FILTERS = ["Remote", "Executive", "FinTech", "Contract"];

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [activeFilter, setActiveFilter] = useState(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", search, location, activeFilter, page],
    queryFn: () =>
      api.get(`/jobs`, {
        params: { search, location, type: activeFilter, page, limit: 6 },
      }).then((r) => r.data),
    keepPreviousData: true,
  });

  const jobs = data?.jobs || [];
  const totalPages = data?.totalPages || 1;

  return (
    <MainLayout>
      <div className="max-w-[960px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Opportunities</h1>
            <p className="text-sm text-gray-500 mt-1">Elite professional placements curated for the top 1% of the Graphite network.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter size={14} /> Filter
            </Button>
            <Button size="sm" className="flex items-center gap-2">
              <Plus size={14} /> Post a Job
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="bg-white rounded-card shadow-card border border-surface-border p-4 mb-4">
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
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary w-36"
              />
            </div>
            <Button size="sm">Search</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => { setActiveFilter(activeFilter === f ? null : f); setPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  activeFilter === f
                    ? "bg-primary text-white border-primary"
                    : "border-gray-300 text-gray-600 hover:border-primary hover:text-primary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Job Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-card shadow-card p-5 h-64 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="space-y-1.5">
                  <div className="h-2.5 bg-gray-200 rounded" />
                  <div className="h-2.5 bg-gray-200 rounded w-5/6" />
                  <div className="h-2.5 bg-gray-200 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => <JobCard key={job._id} job={job} />)}

            {/* "Can't find the right fit" card */}
            <div className="bg-white rounded-card shadow-card border border-surface-border p-5 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                <BellPlus size={22} className="text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Can't find the right fit?</h4>
                <p className="text-xs text-gray-400 mt-1">Create a job alert or post your own opportunity to the network.</p>
              </div>
              <Button variant="outline" size="sm" className="w-full">Create Job Alert</Button>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:border-primary hover:text-primary disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  page === num ? "bg-primary text-white" : "border border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                }`}
              >
                {num}
              </button>
            ))}
            {totalPages > 5 && <span className="text-gray-400">...</span>}
            {totalPages > 5 && (
              <button onClick={() => setPage(totalPages)} className="w-9 h-9 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:border-primary hover:text-primary">
                {totalPages}
              </button>
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:border-primary hover:text-primary disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
