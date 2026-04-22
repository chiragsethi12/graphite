import { TrendingUp } from "lucide-react";

const insights = [
  { category: "STRATEGY", title: "The Rise of Fractional Leadership", readers: "12k professionals reading" },
  { category: "TECH", title: "Ethical AI in Recruitment", readers: "8.6k professionals reading" },
];

export default function TrendingInsights() {
  return (
    <div className="bg-white rounded-card shadow-card border border-surface-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Trending Insights</h3>
        <TrendingUp size={16} className="text-primary" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {insights.map((item) => (
          <button
            key={item.title}
            className="text-left p-3 rounded-xl bg-gray-50 hover:bg-primary-50 transition-colors group"
          >
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              {item.category}
            </span>
            <p className="text-sm font-semibold text-gray-800 group-hover:text-primary leading-snug">
              {item.title}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">{item.readers}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
