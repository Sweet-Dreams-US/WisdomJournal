import Link from "next/link";
import { Users } from "lucide-react";
import Button from "@/components/ui/Button";

export default function GroupNotFound() {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <Users className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
      <h2 className="text-lg font-bold text-twilight mb-2">Group Not Found</h2>
      <p className="text-sm text-charcoal/60 mb-6">
        This group doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Link href="/groups">
        <Button size="sm">Back to Groups</Button>
      </Link>
    </div>
  );
}
