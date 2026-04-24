import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import Input from "../ui/Input";

const JOB_TYPES = [
    { value: "full-time", label: "Full-Time" },
    { value: "part-time", label: "Part-Time" },
    { value: "remote", label: "Remote" },
    { value: "internship", label: "Internship" },
    { value: "contract", label: "Contract" },
];

const EXP_LEVELS = [
    { value: "any", label: "Any" },
    { value: "entry", label: "Entry Level" },
    { value: "mid", label: "Mid Level" },
    { value: "senior", label: "Senior" },
    { value: "lead", label: "Lead / Principal" },
];

export default function PostJobModal({ onClose }) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState({
        title: "",
        company: "",
        location: "",
        type: "full-time",
        experienceLevel: "any",
        description: "",
        skillInput: "",
        skills: [],
        deadline: "",
        salary: {
            min: "",
            max: "",
            currency: "USD",
            period: "yearly",
        },
    });

    const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));
    const updateSalary = (key, val) => setForm((f) => ({ ...f, salary: { ...f.salary, [key]: val } }));

    const addSkill = () => {
        const s = form.skillInput.trim();
        if (s && !form.skills.includes(s)) {
            update("skills", [...form.skills, s]);
        }
        update("skillInput", "");
    };

    const removeSkill = (skill) => update("skills", form.skills.filter((s) => s !== skill));

    const mutation = useMutation({
        mutationFn: () =>
            api.post("/jobs", {
                title: form.title,
                company: form.company,
                location: form.location,
                type: form.type,
                experienceLevel: form.experienceLevel,
                description: form.description,
                skills: form.skills,
                deadline: form.deadline || undefined,
                salary: (form.salary.min || form.salary.max) ? {
                    min: Number(form.salary.min) || undefined,
                    max: Number(form.salary.max) || undefined,
                    currency: form.salary.currency,
                    period: form.salary.period,
                } : undefined,
            }),
        onSuccess: () => {
            toast.success("Job posted successfully!");
            queryClient.invalidateQueries({ queryKey: ["jobs"] });
            queryClient.invalidateQueries({ queryKey: ["myListings"] });
            onClose();
        },
        onError: (err) => toast.error(err.response?.data?.message || "Failed to post job"),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.title || !form.company || !form.description) {
            toast.error("Title, company, and description are required");
            return;
        }
        mutation.mutate();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-card shadow-2xl w-full max-w-[640px] max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
                    <h2 className="text-xl font-bold text-gray-900">Post a Job</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Job Title *</label>
                            <Input
                                value={form.title}
                                onChange={(e) => update("title", e.target.value)}
                                placeholder="e.g. Senior Engineer"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Company *</label>
                            <Input
                                value={form.company}
                                onChange={(e) => update("company", e.target.value)}
                                placeholder="Company name"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Location</label>
                            <Input
                                value={form.location}
                                onChange={(e) => update("location", e.target.value)}
                                placeholder="e.g. New York, NY"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Job Type</label>
                            <select
                                value={form.type}
                                onChange={(e) => update("type", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
                            >
                                {JOB_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Experience Level</label>
                            <select
                                value={form.experienceLevel}
                                onChange={(e) => update("experienceLevel", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
                            >
                                {EXP_LEVELS.map((l) => (
                                    <option key={l.value} value={l.value}>{l.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Application Deadline</label>
                            <Input
                                type="date"
                                value={form.deadline}
                                onChange={(e) => update("deadline", e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                            />
                        </div>
                    </div>

                    {/* Salary */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Salary Range (optional)</label>
                        <div className="grid grid-cols-4 gap-2">
                            <Input
                                type="number"
                                value={form.salary.min}
                                onChange={(e) => updateSalary("min", e.target.value)}
                                placeholder="Min"
                            />
                            <Input
                                type="number"
                                value={form.salary.max}
                                onChange={(e) => updateSalary("max", e.target.value)}
                                placeholder="Max"
                            />
                            <select
                                value={form.salary.currency}
                                onChange={(e) => updateSalary("currency", e.target.value)}
                                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none"
                            >
                                <option>USD</option>
                                <option>EUR</option>
                                <option>GBP</option>
                                <option>INR</option>
                            </select>
                            <select
                                value={form.salary.period}
                                onChange={(e) => updateSalary("period", e.target.value)}
                                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none"
                            >
                                <option value="yearly">/ year</option>
                                <option value="monthly">/ month</option>
                                <option value="hourly">/ hour</option>
                            </select>
                        </div>
                    </div>

                    {/* Skills */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Required Skills</label>
                        <div className="flex gap-2">
                            <Input
                                value={form.skillInput}
                                onChange={(e) => update("skillInput", e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                                placeholder="Add a skill and press Enter"
                                className="flex-1"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={addSkill}>
                                <Plus size={14} />
                            </Button>
                        </div>
                        {form.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {form.skills.map((s) => (
                                    <span
                                        key={s}
                                        className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary text-xs rounded-full font-medium"
                                    >
                                        {s}
                                        <button onClick={() => removeSkill(s)} className="hover:text-primary-900">
                                            <X size={11} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Job Description *</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => update("description", e.target.value)}
                            placeholder="Describe the role, responsibilities, and requirements..."
                            rows={6}
                            required
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-surface-border">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        loading={mutation.isPending}
                        disabled={!form.title || !form.company || !form.description}
                    >
                        Post Job
                    </Button>
                </div>
            </div>
        </div>
    );
}