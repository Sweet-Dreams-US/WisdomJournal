import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center p-4">
      <Link
        href="/"
        className="flex items-center gap-2 mb-8"
      >
        <BookOpen className="w-10 h-10 text-deep-sky" />
        <span className="font-heading font-bold text-2xl text-twilight">
          Wisdom Journal
        </span>
      </Link>
      {children}
    </div>
  );
}
