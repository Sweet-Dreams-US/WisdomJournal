"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@wisdom-journal/shared";

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        // If full_name is missing, fill from auth metadata and persist to DB
        if (!data.full_name || data.full_name.trim() === "") {
          const fallbackName =
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            user.email?.split("@")[0] ??
            null;
          if (fallbackName) {
            data.full_name = fallbackName;
            supabase
              .from("profiles")
              .update({ full_name: fallbackName })
              .eq("id", user.id)
              .then(() => {});
          }
        }
        setProfile(data as UserProfile);
      }
      setLoading(false);
    }

    fetchProfile();
  }, []);

  return { profile, loading };
}
