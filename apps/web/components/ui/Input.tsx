import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-body font-medium text-white/50 mb-1.5 tracking-wide"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-3 rounded-input
            bg-white/5 border border-white/10
            text-white placeholder-white/20
            font-body text-sm
            focus:outline-none focus:ring-1 focus:ring-sky-blue/50 focus:border-sky-blue/30
            transition-all duration-200
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
