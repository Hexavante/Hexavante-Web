"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { themeUi } from "@/lib/theme-ui";

export type NativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div className={cn("relative w-full", themeUi.inputFocus)}>
        <select
          ref={ref}
          className={cn(
            "hx-select w-full appearance-none transition-smooth",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
            className,
          )}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  },
);
NativeSelect.displayName = "NativeSelect";

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

const Select = ({ value, onValueChange, children, className = "" }: SelectProps) => {
  return (
    <div className={cn("relative w-full", themeUi.inputFocus, className)}>
      <select
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        className={cn(
          "hx-select w-full appearance-none transition-smooth",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        )}
      >
        {children}
      </select>
    </div>
  );
};

Select.displayName = "Select";

export const SelectTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "hx-input flex items-center justify-between transition-smooth",
        "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-[var(--background)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
SelectTrigger.displayName = "SelectTrigger";

export const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ className = "", placeholder, ...props }, ref) => (
  <span ref={ref} className={className} {...props}>
    {placeholder}
  </span>
));
SelectValue.displayName = "SelectValue";

export const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-lg border border-white/10 bg-slate-950 p-1 text-white shadow-md dropdown-enter",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  HTMLOptionElement,
  React.OptionHTMLAttributes<HTMLOptionElement> & { value: string }
>(({ className = "", children, value, ...props }, ref) => (
  <option
    ref={ref}
    value={value}
    className={cn("rounded-sm px-2 py-1.5 text-sm hover:bg-primary/10 transition-colors", className)}
    {...props}
  >
    {children}
  </option>
));
SelectItem.displayName = "SelectItem";

export { Select };