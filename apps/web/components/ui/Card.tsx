import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
  variant?: "light" | "glass";
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
    light: "bg-white rounded-card shadow-card",
    glass: "glass-card rounded-2xl",
  };

  return (
    <div
      className={`
        ${variantClasses[variant]}
        ${hover ? "hover:shadow-card-hover transition-shadow duration-200" : ""}
        ${paddingClasses[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
