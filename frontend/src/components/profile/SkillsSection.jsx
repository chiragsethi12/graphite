import { useState } from 'react';
import { Plus, X, Pencil, Edit2, Award } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import Button from '../ui/Button';
import ConfirmAction from '../ui/ConfirmDialog';
import toast from 'react-hot-toast';

export default function SkillsSection({ skills = [], isOwner = false, userId }) {
  const [open, setOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (updated) => api.put('/users/profile', { skills: updated }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'profile',
      });
      setOpen(false);
      setNewSkill('');
      toast.success('Skills updated!');
    },
    onError: () => toast.error('Failed to save'),
  });

  const handleAdd = () => {
    const trimmed = newSkill.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    addMutation.mutate([...skills, trimmed]);
  };

  const handleRemove = (skill) => {
    addMutation.mutate(skills.filter((s) => s !== skill));
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 md:p-7">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900">Skills</h2>
        <div className="flex items-center gap-1">
          {isOwner && (
            <>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-primary font-semibold hover:bg-primary-50 transition-all">
                <Award size={12} /> Take Quiz
              </button>
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
        <div className="mb-5 flex gap-2">
          <input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="e.g. Strategic Planning"
            className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary transition-all"
          />
          <Button size="sm" onClick={handleAdd} loading={addMutation.isPending}>
            Add
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2.5">
        {skills.map((skill) => (
          <div key={skill} className="flex items-center gap-1 group">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 hover:text-primary transition-all cursor-default">
              {skill}
            </span>
            {isOwner && open && (
              <ConfirmAction
                onConfirm={() => handleRemove(skill)}
                message={`Remove "${skill}"?`}
                confirmLabel="Remove"
              >
                {(requestConfirm) => (
                  <button
                    onClick={requestConfirm}
                    className="p-0.5 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </ConfirmAction>
            )}
          </div>
        ))}
        {skills.length === 0 && (
          <p className="text-sm text-gray-400 italic">
            {isOwner ? 'Add skills to showcase your expertise.' : 'No skills added yet.'}
          </p>
        )}
      </div>
    </div>
  );
}
