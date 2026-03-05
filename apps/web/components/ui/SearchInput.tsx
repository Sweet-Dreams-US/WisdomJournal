import { Search } from "lucide-react";
import { type InputHTMLAttributes, forwardRef } from "react";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
        <input
          ref={ref}
          type="text"
          className={`
            w-full pl-10 pr-4 py-2.5 rounded-input
            bg-white border border-soft-gray
            text-charcoal placeholder-charcoal/40
            font-body text-sm
            focus:outline-none focus:ring-1 focus:ring-deep-sky/50 focus:border-deep-sky/30
            transition-all duration-200
            ${className}
          `}
          {...props}
        />
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export default SearchInput;
