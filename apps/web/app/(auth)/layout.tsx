import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen gradient-dreamy flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-deep-sky/5 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-golden-hour/5 blur-[80px]" />

      <Link
        href="/"
        className="flex items-center gap-2 mb-10 relative z-10"
      >
        <BookOpen className="w-8 h-8 text-sky-blue" />
        <span className="font-heading text-lg text-white">
          Wisdom
        </span>
      </Link>
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
