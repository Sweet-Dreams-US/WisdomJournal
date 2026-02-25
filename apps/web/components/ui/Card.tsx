import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
}

const paddingClasses = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({
  hover = false,
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-card shadow-card
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
