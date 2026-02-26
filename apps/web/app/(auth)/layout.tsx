import Link from "next/link";
import { BookOpen } from "lucide-react";
import DynamicSky from "@/components/sky/DynamicSky";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <DynamicSky />

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
