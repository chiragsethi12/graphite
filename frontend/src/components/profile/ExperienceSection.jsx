import { useState } from "react";
import { Briefcase, Plus, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import Button from "../ui/Button";
import Input from "../ui/Input";
import toast from "react-hot-toast";

function ExperienceItem({ exp }) {
  const duration = [exp.startDate, exp.endDate || "Present"].join(" - ");
  return (
    <div className="flex gap-4">
      <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Briefcase size={16} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
        <p className="font-semibold text-gray-900">{exp.title}</p>
        <p className="text-sm text-gray-500">{exp.company} · Full-time</p>
        <p className="text-xs text-gray-400 mt-0.5">{duration}</p>
        {exp.description && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{exp.description}</p>}
      </div>
    </div>
  );
}

export default function ExperienceSection({ experiences = [], isOwner = false, userId }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", company: "", startDate: "", endDate: "", description: "" });
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: () => api.put("/users/profile", { experience: [...experiences, form] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      setOpen(false);
      setForm({ title: "", company: "", startDate: "", endDate: "", description: "" });
      toast.success("Experience added!");
    },
    onError: () => toast.error("Failed to save"),
  });

  return (
    <div className="bg-white rounded-card shadow-card border border-surface-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-base">Experience</h3>
        {isOwner && (
          <button onClick={() => setOpen((p) => !p)} className="p-1 text-gray-400 hover:text-primary">
            {open ? <X size={18} /> : <Plus size={18} />}
          </button>
        )}
      </div>

      {open && (
        <div className="mb-4 p-4 bg-gray-50 rounded-xl flex flex-col gap-3">
          <Input label="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Chief Strategy Officer" />
          <Input label="Company" value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} placeholder="Lumina Tech" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} placeholder="Jan 2021" />
            <Input label="End Date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} placeholder="Present" />
          </div>
          <Input label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description..." />
          <Button size="sm" onClick={() => addMutation.mutate()} loading={addMutation.isPending}>Save</Button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {experiences.map((exp, i) => <ExperienceItem key={i} exp={exp} />)}
        {experiences.length === 0 && <p className="text-sm text-gray-400">No experience added yet.</p>}
      </div>
    </div>
  );
}
