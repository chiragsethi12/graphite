import clsx from "clsx";

const variants = {
  skill:   "bg-primary-50 text-primary-800 border border-primary-200",
  gray:    "bg-gray-100 text-gray-700",
  green:   "bg-green-50 text-green-700 border border-green-200",
  premium: "bg-amber-50 text-amber-700 border border-amber-200",
};

export default function Badge({ children, variant = "gray", className = "" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
