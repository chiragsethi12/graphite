import { useState } from 'react';
import { Plus, X, Pencil } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import toast from 'react-hot-toast';

export default function SkillsSection({ skills = [], isOwner = false, userId }) {
  const [open, setOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (updated) => api.put('/users/profile', { skills: updated }),
    onSuccess: () => {
      // Invalidate any profile queries (by id or username) so UI always refreshes
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
    <div className="bg-white rounded-card shadow-card border border-surface-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-base">Skills</h3>
        <div className="flex items-center gap-2">
          {isOwner && (
            <>
              <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                <Pencil size={12} /> Take Skill Quiz
              </button>
              <button
                onClick={() => setOpen((p) => !p)}
                className="p-1 text-gray-400 hover:text-primary"
              >
                {open ? <X size={18} /> : <Plus size={18} />}
              </button>
            </>
          )}
        </div>
      </div>

      {open && (
        <div className="mb-4 flex gap-2">
          <input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="e.g. Strategic Planning"
            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
          <Button size="sm" onClick={handleAdd} loading={addMutation.isPending}>
            Add
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <div key={skill} className="flex items-center gap-1 group">
            <Badge variant="skill">{skill}</Badge>
            {isOwner && open && (
              <button
                onClick={() => handleRemove(skill)}
                className="text-gray-300 hover:text-red-500 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        {skills.length === 0 && <p className="text-sm text-gray-400">No skills added yet.</p>}
      </div>
    </div>
  );
}
