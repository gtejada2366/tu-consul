import { forwardRef, type ReactNode, type MouseEventHandler } from "react";
import { motion } from "motion/react";

interface ButtonProps {
  variant?: "primary" | "secondary" | "tertiary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: ReactNode;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, disabled, type, onClick }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-primary text-white hover:bg-primary-dark",
      secondary: "bg-surface-alt text-foreground hover:bg-border",
      tertiary: "border border-border bg-surface text-foreground hover:bg-surface-alt",
      danger: "bg-danger text-white hover:opacity-90",
      ghost: "text-foreground-secondary hover:bg-surface-alt hover:text-foreground",
    };

    const sizes = {
      sm: "h-8 px-3 text-[0.75rem] rounded-[8px]",
      md: "h-10 px-4 text-[0.875rem] rounded-[10px]",
      lg: "h-12 px-6 text-[0.875rem] rounded-[10px]",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled ? 1 : 1.01 }}
        whileTap={{ scale: disabled ? 1 : 0.99 }}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled}
        type={type}
        onClick={onClick}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
