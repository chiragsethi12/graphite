import { useState } from 'react';
import { Briefcase, Plus, X, Edit2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import Button from '../ui/Button';
import Input from '../ui/Input';
import toast from 'react-hot-toast';

function ExperienceItem({ exp, isLast }) {
  const duration = [exp.startDate, exp.endDate || 'Present'].join(' – ');
  const isCurrent = !exp.endDate || exp.endDate === 'Present';

  return (
    <div className="flex gap-4 relative">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[22px] top-[52px] bottom-0 w-px bg-gray-100" />
      )}

      {/* Logo / icon */}
      <div className="relative z-10 flex-shrink-0">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
          isCurrent ? 'bg-primary-50 ring-2 ring-primary-100' : 'bg-gray-50 border border-gray-100'
        }`}>
          <Briefcase size={18} className={isCurrent ? 'text-primary' : 'text-gray-400'} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-semibold text-gray-900 text-[15px] leading-tight">{exp.title}</h4>
            <p className="text-sm text-gray-600 mt-0.5">{exp.company} · Full-time</p>
            <p className="text-xs text-gray-400 mt-1">{duration}</p>
          </div>
        </div>
        {exp.description && (
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">{exp.description}</p>
        )}
      </div>
    </div>
  );
}

export default function ExperienceSection({ experiences = [], isOwner = false, userId }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    description: '',
  });
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: () => api.put('/users/profile', { experience: [...experiences, form] }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'profile',
      });
      setOpen(false);
      setForm({ title: '', company: '', startDate: '', endDate: '', description: '' });
      toast.success('Experience added!');
    },
    onError: () => toast.error('Failed to save'),
  });

  return (
    <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 md:p-7">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900">Experience</h2>
        <div className="flex items-center gap-1">
          {isOwner && (
            <>
              <button
                onClick={() => setOpen((p) => !p)}
                className="p-2 rounded-xl text-gray-400 hover:text-primary hover:bg-primary-50/50 transition-all"
              >
                {open ? <X size={16} /> : <Plus size={16} />}
              </button>
              <button className="p-2 rounded-xl text-gray-400 hover:text-primary hover:bg-primary-50/50 transition-all">
                <Edit2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {open && (
        <div className="mb-6 p-5 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-col gap-3.5">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Chief Strategy Officer"
          />
          <Input
            label="Company"
            value={form.company}
            onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
            placeholder="Lumina Tech"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              value={form.startDate}
              onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
              placeholder="Jan 2021"
            />
            <Input
              label="End Date"
              value={form.endDate}
              onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
              placeholder="Present"
            />
          </div>
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Brief description of your role…"
          />
          <div className="flex justify-end gap-2 mt-1">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => addMutation.mutate()} loading={addMutation.isPending}>
              Save
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col">
        {experiences.map((exp, i) => (
          <ExperienceItem key={i} exp={exp} isLast={i === experiences.length - 1} />
        ))}
        {experiences.length === 0 && (
          <p className="text-sm text-gray-400 italic">
            {isOwner ? 'Add your professional experience to stand out.' : 'No experience added yet.'}
          </p>
        )}
      </div>
    </div>
  );
}
