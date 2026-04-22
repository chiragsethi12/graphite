import { forwardRef } from "react";
import clsx from "clsx";

const Input = forwardRef(function Input(
  { label, error, icon: Icon, className = "", ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={16} />
          </span>
        )}
        <input
          ref={ref}
          className={clsx(
            "w-full rounded-lg border px-3 py-2 text-sm placeholder-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary",
            "transition-colors duration-150",
            Icon && "pl-9",
            error
              ? "border-red-400 focus:ring-red-200"
              : "border-gray-300",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default Input;
