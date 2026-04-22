import { MapPin, DollarSign, Clock, Bookmark } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import api from "../../lib/axios";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import toast from "react-hot-toast";

const badgeConfig = {
  "Active Now": "green",
  "Featured": "premium",
};

export default function JobCard({ job }) {
  const applyMutation = useMutation({
    mutationFn: () => api.post(`/jobs/${job._id}/apply`),
    onSuccess: () => toast.success("Application submitted!"),
    onError: (err) => toast.error(err.response?.data?.message || "Failed to apply"),
  });

  const badge = job.badge || (job.featured ? "Featured" : null);

  return (
    <div className="bg-white rounded-card shadow-card border border-surface-border p-5 flex flex-col gap-3 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600 overflow-hidden flex-shrink-0">
          {job.companyLogo ? (
            <img src={job.companyLogo} alt={job.company} className="w-full h-full object-contain" />
          ) : (
            job.company?.[0]
          )}
        </div>
        {badge && (
          <Badge variant={badgeConfig[badge] || "gray"} className="text-[10px]">{badge}</Badge>
        )}
        {!badge && job.daysAgo && (
          <span className="text-[11px] text-gray-400">{job.daysAgo} ago</span>
        )}
      </div>

      <div>
        <h3 className="font-bold text-gray-900 text-base leading-tight">{job.title}</h3>
        <p className="text-sm font-medium text-primary mt-0.5">{job.company}</p>
        <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">{job.description}</p>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
        {job.location && (
          <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
        )}
        {job.salary && (
          <span className="flex items-center gap-1"><DollarSign size={11} />{job.salary}</span>
        )}
        {job.type && (
          <span className="flex items-center gap-1"><Clock size={11} />{job.type}</span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-auto pt-2">
        <Button
          size="sm"
          fullWidth
          loading={applyMutation.isPending}
          onClick={() => applyMutation.mutate()}
        >
          Apply
        </Button>
        <button className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-primary hover:border-primary transition-colors flex-shrink-0">
          <Bookmark size={15} />
        </button>
      </div>
    </div>
  );
}
