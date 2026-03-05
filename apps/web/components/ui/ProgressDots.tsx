interface ProgressDotsProps {
  total: number;
  completed: number;
}

export default function ProgressDots({ total, completed }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`
            w-3 h-3 rounded-full transition-colors duration-200
            ${i < completed ? "bg-deep-sky" : "bg-soft-gray"}
          `}
        />
      ))}
    </div>
  );
}
