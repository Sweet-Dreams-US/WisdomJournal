import Link from "next/link";
import { FileQuestion } from "lucide-react";
import Button from "@/components/ui/Button";

export default function ResponseNotFound() {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <FileQuestion className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
      <h2 className="text-lg font-bold text-twilight mb-2">Response Not Found</h2>
      <p className="text-sm text-charcoal/60 mb-6">
        This journal entry doesn&apos;t exist or may have been removed.
      </p>
      <Link href="/journal">
        <Button size="sm">Back to Journal</Button>
      </Link>
    </div>
  );
}
