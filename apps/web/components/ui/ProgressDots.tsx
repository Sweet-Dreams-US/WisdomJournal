interface ProgressDotsProps {
  total: number;
  completed: number;
}

export default function ProgressDots({ total, completed }: ProgressDotsProps) {
  // Fill runs from the first dot's center to the last completed dot's
  // center, so it never extends past the progress it represents.
  const fillFraction =
    total > 1 ? Math.max(0, Math.min(completed, total) - 1) / (total - 1) : 0;

  return (
    <div className="relative flex items-center gap-1.5">
      <style>{`
        @keyframes wj-dot-pop {
          0% { transform: scale(0); }
          70% { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Connecting line: quiet track + proportional fill (scaleX, 400ms) */}
      {total > 1 && (
        <div
          aria-hidden="true"
          className="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-px rounded-full bg-charcoal/10"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-deep-sky to-sky-blue transition-transform duration-[400ms] ease-out"
            style={{
              transform: `scaleX(${fillFraction})`,
              transformOrigin: "left center",
            }}
          />
        </div>
      )}

      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`
            relative w-2 h-2 rounded-full transition-all duration-300
            ${
              i < completed
                ? "bg-gradient-to-r from-deep-sky to-sky-blue"
                : "bg-charcoal/10 scale-90"
            }
          `}
          style={
            i < completed
              ? {
                  animation:
                    "wj-dot-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both",
                  animationDelay: `${i * 0.04}s`,
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}
