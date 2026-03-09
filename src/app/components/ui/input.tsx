import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-[0.75rem] font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full h-10 px-3 bg-surface border rounded-[10px]
            text-[0.875rem] text-foreground placeholder:text-foreground-secondary
            transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-danger" : "border-border"}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-[0.75rem] text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
