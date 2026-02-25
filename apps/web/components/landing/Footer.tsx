import Link from "next/link";
import { BookOpen } from "lucide-react";
import Button from "@/components/ui/Button";

export default function Footer() {
  return (
    <footer>
      {/* CTA Section */}
      <section className="py-24 gradient-sky text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Start preserving your wisdom today
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Every day that passes is wisdom that could be lost. Begin your
            journey of capturing what matters most.
          </p>
          <Link href="/register">
            <Button variant="secondary" size="lg">
              Create Your Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer links */}
      <div className="bg-twilight text-white/70 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-sky-blue" />
              <span className="font-heading font-bold text-lg text-white">
                Wisdom Journal
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>

            <p className="text-sm">
              &copy; {new Date().getFullYear()} Sweet Dreams Music LLC. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
