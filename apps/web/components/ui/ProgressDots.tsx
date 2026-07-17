interface ProgressDotsProps {
  total: number;
  completed: number;
}

export default function ProgressDots({ total, completed }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`
            w-2 h-2 rounded-full transition-all duration-300
            ${
              i < completed
                ? "bg-gradient-to-r from-deep-sky to-sky-blue scale-100"
                : "bg-charcoal/10 scale-90"
            }
          `}
        />
      ))}
    </div>
  );
}
