/**
 * Premium skeleton screens that match real component layouts.
 * Uses shimmer animation for a polished loading feel.
 */

/* ─── Shimmer base ────────────────────────────────────────────────────────── */

function Shimmer({ className = "" }) {
  return (
    <div
      className={`relative overflow-hidden bg-gray-200/70 rounded ${className}`}
      style={{ isolation: "isolate" }}
    >
      <div
        className="absolute inset-0 -translate-x-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
          animation: "shimmer 1.8s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/* ─── Post Card Skeleton ──────────────────────────────────────────────────── */

export function PostCardSkeleton() {
  return (
    <div className="bg-white rounded-card shadow-card border border-surface-border overflow-hidden">
      {/* Author row */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <Shimmer className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-0.5">
          <Shimmer className="h-3.5 w-32 rounded-md" />
          <Shimmer className="h-2.5 w-48 rounded-md" />
          <Shimmer className="h-2 w-16 rounded-md" />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3 space-y-2">
        <Shimmer className="h-3 w-full rounded-md" />
        <Shimmer className="h-3 w-5/6 rounded-md" />
        <Shimmer className="h-3 w-3/4 rounded-md" />
      </div>

      {/* Image placeholder */}
      <Shimmer className="h-52 w-full rounded-none" />

      {/* Stats row */}
      <div className="px-4 py-2.5 flex items-center gap-3 border-t border-surface-border">
        <Shimmer className="h-2.5 w-12 rounded-md" />
        <Shimmer className="h-2.5 w-20 rounded-md" />
      </div>

      {/* Action buttons */}
      <div className="px-4 py-2.5 flex items-center gap-4 border-t border-surface-border">
        <Shimmer className="h-7 w-16 rounded-lg" />
        <Shimmer className="h-7 w-24 rounded-lg" />
        <Shimmer className="h-7 w-16 rounded-lg" />
      </div>
    </div>
  );
}

/* ─── Feed Skeleton (multiple posts) ──────────────────────────────────────── */

export function FeedSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ─── Profile Sidebar Skeleton ────────────────────────────────────────────── */

export function ProfileSidebarSkeleton() {
  return (
    <div className="bg-white rounded-card shadow-card border border-surface-border overflow-hidden">
      {/* Banner */}
      <Shimmer className="h-24 w-full rounded-none" />

      {/* Avatar */}
      <div className="flex justify-center -mt-10 relative z-10">
        <div className="ring-4 ring-white rounded-full">
          <Shimmer className="w-20 h-20 rounded-full" />
        </div>
      </div>

      <div className="pt-3 pb-5 px-5 text-center space-y-3">
        <Shimmer className="h-5 w-36 mx-auto rounded-md" />
        <Shimmer className="h-3 w-20 mx-auto rounded-md" />
        <Shimmer className="h-3 w-48 mx-auto rounded-md" />
        <Shimmer className="h-3 w-28 mx-auto rounded-md" />

        {/* Stats */}
        <div className="border-t border-gray-100 mt-4 pt-4 flex justify-around">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Shimmer className="h-5 w-8 rounded-md" />
              <Shimmer className="h-2 w-14 rounded-md" />
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="mt-4 space-y-2">
          <Shimmer className="h-9 w-full rounded-lg" />
          <Shimmer className="h-9 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/* ─── Profile Content Skeleton ────────────────────────────────────────────── */

export function ProfileContentSkeleton() {
  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 pb-0">
        {[1, 2, 3].map((i) => (
          <Shimmer key={i} className="h-9 w-24 rounded-t-md" />
        ))}
      </div>

      {/* About card */}
      <div className="bg-white rounded-card shadow-card border border-surface-border p-5 space-y-3">
        <Shimmer className="h-5 w-20 rounded-md" />
        <Shimmer className="h-3 w-full rounded-md" />
        <Shimmer className="h-3 w-5/6 rounded-md" />
        <Shimmer className="h-3 w-4/6 rounded-md" />
      </div>

      {/* Experience card */}
      <div className="bg-white rounded-card shadow-card border border-surface-border p-5 space-y-4">
        <Shimmer className="h-5 w-28 rounded-md" />
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-4">
            <Shimmer className="w-9 h-9 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2 pb-4 border-b border-gray-100 last:border-0">
              <Shimmer className="h-3.5 w-40 rounded-md" />
              <Shimmer className="h-3 w-32 rounded-md" />
              <Shimmer className="h-2.5 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Skills card */}
      <div className="bg-white rounded-card shadow-card border border-surface-border p-5 space-y-3">
        <Shimmer className="h-5 w-16 rounded-md" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Shimmer key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Connection Card Skeleton ────────────────────────────────────────────── */

export function ConnectionCardSkeleton() {
  return (
    <div className="bg-white rounded-card shadow-card border border-surface-border p-5 flex flex-col items-center text-center gap-3">
      <Shimmer className="w-14 h-14 rounded-full" />
      <div className="space-y-2 w-full">
        <Shimmer className="h-3.5 w-24 mx-auto rounded-md" />
        <Shimmer className="h-2.5 w-36 mx-auto rounded-md" />
        <Shimmer className="h-2 w-20 mx-auto rounded-md" />
      </div>
      <Shimmer className="h-8 w-full rounded-lg mt-1" />
    </div>
  );
}

/* ─── Notification Skeleton ───────────────────────────────────────────────── */

export function NotificationSkeleton({ count = 4 }) {
  return (
    <div className="bg-white rounded-card shadow-card border border-surface-border overflow-hidden divide-y divide-gray-100">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3.5">
          <div className="relative flex-shrink-0">
            <Shimmer className="w-10 h-10 rounded-full" />
            <Shimmer className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full" />
          </div>
          <div className="flex-1 space-y-2 pt-0.5">
            <Shimmer className="h-3 w-4/5 rounded-md" />
            <Shimmer className="h-2.5 w-20 rounded-md" />
          </div>
          <div className="flex gap-1">
            <Shimmer className="w-6 h-6 rounded" />
            <Shimmer className="w-6 h-6 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Global shimmer keyframe (injected once) ─────────────────────────────── */

const styleId = "graphite-shimmer-style";
if (typeof document !== "undefined" && !document.getElementById(styleId)) {
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    @keyframes shimmer {
      100% { transform: translateX(100%); }
    }
  `;
  document.head.appendChild(style);
}
