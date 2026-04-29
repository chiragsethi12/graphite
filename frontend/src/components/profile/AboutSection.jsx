import { useState } from 'react';
import { Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AboutSection({ about, isOwner }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const text = about || '';
  const PREVIEW_LENGTH = 280;
  const isLong = text.length > PREVIEW_LENGTH;
  const displayText = expanded || !isLong ? text : text.slice(0, PREVIEW_LENGTH);

  return (
    <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 md:p-7">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">About</h2>
        {isOwner && (
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-xl text-gray-400 hover:text-primary hover:bg-primary-50/50 transition-all"
          >
            <Edit2 size={16} />
          </button>
        )}
      </div>

      {text ? (
        <div>
          <p className="text-[15px] text-gray-600 leading-[1.7] whitespace-pre-wrap break-words">
            {displayText}
            {isLong && !expanded && (
              <span className="text-gray-400">… </span>
            )}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-sm font-semibold text-primary hover:underline transition-colors"
            >
              {expanded ? 'Show less' : '…see more'}
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">
          {isOwner
            ? 'Tell the world about yourself. Add a summary to help people learn about you.'
            : 'No bio added yet.'}
        </p>
      )}
    </div>
  );
}
