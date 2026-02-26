import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-deep-sky to-sky-blue text-white hover:from-sky-blue hover:to-deep-sky shadow-glow hover:shadow-glow-lg",
  secondary:
    "bg-gradient-to-r from-golden-hour to-[#e8951c] text-night-sky hover:from-[#e8951c] hover:to-golden-hour glow-gold",
  ghost:
    "bg-transparent text-white/60 hover:text-white hover:bg-white/5",
  outline:
    "bg-transparent border border-white/20 text-white/80 hover:border-sky-blue/50 hover:text-sky-blue hover:bg-sky-blue/5",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", fullWidth, className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center font-body font-semibold
          rounded-button transition-all duration-300 ease-out
          disabled:opacity-50 disabled:cursor-not-allowed
          tracking-wide
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
