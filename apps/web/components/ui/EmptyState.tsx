import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Brand illustrations (generated for Wisdom Journal): little windows into
 * the night sky, shown inside a navy vignette that matches the artwork's
 * background (#0b1224) so they sit naturally on the light app surface.
 */
const ILLUSTRATIONS = {
  book: { src: "/illustrations/book.webp", alt: "An open book releasing stars into the night sky" },
  tree: { src: "/illustrations/tree.webp", alt: "A family tree drawn in constellations" },
  lantern: { src: "/illustrations/lantern.webp", alt: "A warm lantern glowing among night clouds" },
} as const;

export type EmptyStateIllustration = keyof typeof ILLUSTRATIONS;

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  /** Optional night-sky vignette shown instead of the icon tile. */
  illustration?: EmptyStateIllustration;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  illustration,
}: EmptyStateProps) {
  const art = illustration ? ILLUSTRATIONS[illustration] : null;

  return (
    <div className="text-center py-16 animate-fade-in">
      {art ? (
        <div
          className="relative w-36 h-36 rounded-[2rem] mx-auto mb-6 overflow-hidden shadow-card animate-scale-in"
          style={{ backgroundColor: "#0b1224" }}
        >
          <Image
            src={art.src}
            alt={art.alt}
            fill
            sizes="144px"
            className="object-contain scale-110 animate-float-slow"
          />
          {/* soft inner glow so the vignette feels lit from within */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 50% 60%, rgba(245,166,35,0.10) 0%, transparent 65%)",
            }}
          />
        </div>
      ) : (
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-deep-sky/8 to-sky-blue/4 flex items-center justify-center mx-auto mb-5">
          <Icon className="w-10 h-10 text-charcoal/20" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-twilight mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-charcoal/50 max-w-sm mx-auto mb-6 leading-relaxed">{description}</p>
      {action}
    </div>
  );
}
