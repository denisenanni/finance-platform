import * as React from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends React.ComponentProps<"select"> {
  icon?: React.ReactNode;
  options: { label: string; value: string }[];
  placeholder?: string;
}

function Select({
  className,
  icon,
  options,
  placeholder,
  onChange,
  ...props
}: SelectProps) {
  return (
    <div className="relative w-full">
      <select
        data-slot="select"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30",
          "border-input flex h-9 w-full min-w-0 appearance-none rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          // Add right padding for icon space
          icon ? "pr-9" : "",
          className
        )}
        aria-label="select"
        {...props}
        onChange={onChange}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {icon && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {icon}
        </div>
      )}
    </div>
  );
}

export { Select };
