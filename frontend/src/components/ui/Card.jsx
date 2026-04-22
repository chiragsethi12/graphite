import clsx from "clsx";

export default function Card({ children, className = "", padding = true, ...props }) {
  return (
    <div
      className={clsx(
        "bg-white rounded-card shadow-card border border-surface-border",
        padding && "p-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
