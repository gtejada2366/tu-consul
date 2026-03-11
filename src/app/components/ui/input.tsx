import { InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-[0.75rem] font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={isPassword && showPassword ? "text" : type}
            className={`
              w-full h-10 px-3 ${isPassword ? "pr-10" : ""} bg-surface border rounded-[10px]
              text-[0.875rem] text-foreground placeholder:text-foreground-secondary
              transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? "border-danger" : "border-border"}
              ${className}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-secondary hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && (
          <p className="text-[0.75rem] text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
