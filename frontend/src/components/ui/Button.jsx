import clsx from "clsx";

const variants = {
  primary: "bg-primary text-white hover:bg-primary-950",
  outline: "border border-primary text-primary hover:bg-primary-50",
  ghost:   "text-gray-600 hover:bg-gray-100",
  danger:  "bg-red-600 text-white hover:bg-red-700",
  white:   "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50",
};

const sizes = {
  sm:  "text-xs px-3 py-1.5",
  md:  "text-sm px-4 py-2",
  lg:  "text-base px-6 py-2.5",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  loading = false,
  className = "",
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-semibold rounded-lg",
        "active:scale-[0.98] transition-all duration-150 cursor-pointer",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
