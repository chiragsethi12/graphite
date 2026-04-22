import clsx from "clsx";

const sizes = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-14 h-14 text-xl",
  xl: "w-20 h-20 text-3xl",
};

export default function Avatar({ src, name, size = "md", online = false, className = "" }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div className={clsx("relative flex-shrink-0", className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={clsx("rounded-full object-cover", sizes[size])}
        />
      ) : (
        <div
          className={clsx(
            "rounded-full bg-primary-100 text-primary font-semibold",
            "flex items-center justify-center",
            sizes[size]
          )}
        >
          {initials}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
      )}
    </div>
  );
}
