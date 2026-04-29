import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import Card from "../ui/Card";

const FIELDS = [
  { key: "name",       label: "Full name",       weight: 10, check: (u) => !!u.name?.trim() },
  { key: "headline",   label: "Headline",         weight: 15, check: (u) => !!u.headline?.trim() },
  { key: "about",      label: "About / Bio",      weight: 15, check: (u) => !!(u.about?.trim() || u.bio?.trim()) },
  { key: "location",   label: "Location",         weight: 10, check: (u) => !!u.location?.trim() },
  { key: "profilePic", label: "Profile photo",     weight: 15, check: (u) => !!u.profilePic },
  { key: "skills",     label: "Skills",            weight: 15, check: (u) => u.skills?.length > 0 },
  { key: "experience", label: "Experience",        weight: 10, check: (u) => u.experience?.length > 0 },
  { key: "education",  label: "Education",         weight: 10, check: (u) => u.education?.length > 0 },
];

export default function ProfileCompletionCard({ profile }) {
  const navigate = useNavigate();

  const { percentage, completed, suggestions } = useMemo(() => {
    let earned = 0;
    const done = [];
    const todo = [];

    for (const field of FIELDS) {
      if (field.check(profile)) {
        earned += field.weight;
        done.push(field);
      } else {
        todo.push(field);
      }
    }

    return {
      percentage: earned,
      completed: done,
      suggestions: todo,
    };
  }, [profile]);

  // Don't show if profile is 100% complete
  if (percentage === 100) return null;

  // Calculate next milestone
  const nextMilestone = suggestions.length > 0
    ? percentage + suggestions[0].weight
    : 100;

  // Color based on completion
  const barColor =
    percentage >= 80
      ? "bg-green-500"
      : percentage >= 50
      ? "bg-amber-500"
      : "bg-primary";

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${barColor}`}>
          {percentage}%
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Profile Completion</p>
          <p className="text-[11px] text-gray-400">
            {percentage < 50 ? "Let's get started!" : percentage < 80 ? "Looking good!" : "Almost there!"}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          {suggestions.slice(0, 3).map((field) => (
            <button
              key={field.key}
              onClick={() => navigate("/settings")}
              className="w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <AlertCircle size={14} className="text-gray-300 flex-shrink-0" />
              <span className="text-xs text-gray-600 flex-1">
                Add <span className="font-semibold text-gray-800">{field.label.toLowerCase()}</span>
                {" "}to reach {Math.min(percentage + field.weight, 100)}%
              </span>
              <ArrowRight size={12} className="text-gray-300 group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      )}

      {/* Completed fields (collapsed) */}
      {completed.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1.5">
            {completed.map((field) => (
              <span
                key={field.key}
                className="inline-flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium"
              >
                <CheckCircle size={10} />
                {field.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
