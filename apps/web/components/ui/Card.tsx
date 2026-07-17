import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
  variant?: "light" | "glass" | "elevated" | "gradient";
}

const paddingClasses = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({
  hover = false,
  padding = "md",
  variant = "light",
  className = "",
  children,
  ...props
}: CardProps) {
  const variantClasses = {
    light: "bg-white rounded-card shadow-card border border-charcoal/[0.04]",
    glass: "glass-card rounded-2xl",
    elevated:
      "bg-white rounded-card shadow-card border border-charcoal/[0.04] shadow-inner-glow",
    gradient: "card-gradient-border rounded-card shadow-card",
  };

  return (
    <div
      className={`
        ${variantClasses[variant]}
        ${
          hover
            ? "hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer"
            : "transition-shadow duration-200"
        }
        ${paddingClasses[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
