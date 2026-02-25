import { User, Settings } from "lucide-react";
import Card from "@/components/ui/Card";

export default function ProfilePage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-twilight mb-2">
          Your Profile
        </h2>
        <p className="text-charcoal/60">
          Manage your account settings and preferences.
        </p>
      </div>

      <Card padding="lg">
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-soft-gray mx-auto mb-4 flex items-center justify-center">
            <User className="w-10 h-10 text-warm-gray" />
          </div>
          <h3 className="text-xl font-bold text-twilight mb-2">
            Profile Settings
          </h3>
          <p className="text-charcoal/60 max-w-md mx-auto">
            Account management, notification preferences, and subscription
            details will be available here soon.
          </p>
        </div>
      </Card>
    </div>
  );
}
