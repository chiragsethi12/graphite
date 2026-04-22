import { useState } from "react";
import { GraduationCap, Plus, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import Button from "../ui/Button";
import Input from "../ui/Input";
import toast from "react-hot-toast";

function EducationItem({ edu }) {
  return (
    <div className="flex gap-4">
      <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <GraduationCap size={16} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
        <p className="font-semibold text-gray-900">{edu.school}</p>
        <p className="text-sm text-gray-500">{edu.degree}{edu.field ? ` · ${edu.field}` : ""}</p>
        <p className="text-xs text-gray-400 mt-0.5">{edu.startYear} - {edu.endYear || "Present"}</p>
      </div>
    </div>
  );
}

export default function EducationSection({ educations = [], isOwner = false, userId }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ school: "", degree: "", field: "", startYear: "", endYear: "" });
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: () => api.put("/users/profile", { education: [...educations, form] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      setOpen(false);
      toast.success("Education added!");
    },
    onError: () => toast.error("Failed to save"),
  });

  return (
    <div className="bg-white rounded-card shadow-card border border-surface-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-base">Education</h3>
        {isOwner && (
          <button onClick={() => setOpen((p) => !p)} className="p-1 text-gray-400 hover:text-primary">
            {open ? <X size={18} /> : <Plus size={18} />}
          </button>
        )}
      </div>

      {open && (
        <div className="mb-4 p-4 bg-gray-50 rounded-xl flex flex-col gap-3">
          <Input label="School" value={form.school} onChange={(e) => setForm((p) => ({ ...p, school: e.target.value }))} placeholder="London School of Economics" />
          <Input label="Degree" value={form.degree} onChange={(e) => setForm((p) => ({ ...p, degree: e.target.value }))} placeholder="Master of Business Administration" />
          <Input label="Field" value={form.field} onChange={(e) => setForm((p) => ({ ...p, field: e.target.value }))} placeholder="Business" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Year" value={form.startYear} onChange={(e) => setForm((p) => ({ ...p, startYear: e.target.value }))} placeholder="2014" />
            <Input label="End Year" value={form.endYear} onChange={(e) => setForm((p) => ({ ...p, endYear: e.target.value }))} placeholder="2016" />
          </div>
          <Button size="sm" onClick={() => addMutation.mutate()} loading={addMutation.isPending}>Save</Button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {educations.map((edu, i) => <EducationItem key={i} edu={edu} />)}
        {educations.length === 0 && <p className="text-sm text-gray-400">No education added yet.</p>}
      </div>
    </div>
  );
}
