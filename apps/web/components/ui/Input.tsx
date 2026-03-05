import { forwardRef, type InputHTMLAttributes } from "react";

type InputVariant = "dark" | "light";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: InputVariant;
}

const variantClasses: Record<InputVariant, { label: string; input: string }> = {
  dark: {
    label: "text-white/50",
    input:
      "bg-white/5 border-white/10 text-white placeholder-white/20 focus:ring-sky-blue/50 focus:border-sky-blue/30",
  },
  light: {
    label: "text-charcoal/60",
    input:
      "bg-white border-soft-gray text-charcoal placeholder-charcoal/40 focus:ring-deep-sky/50 focus:border-deep-sky/30",
  },
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, variant = "dark", className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const styles = variantClasses[variant];

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-xs font-body font-medium mb-1.5 tracking-wide ${styles.label}`}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-3 rounded-input
            border font-body text-sm
            focus:outline-none focus:ring-1
            transition-all duration-200
            ${styles.input}
            ${error ? "border-error ring-1 ring-error/50" : ""}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs font-body text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
