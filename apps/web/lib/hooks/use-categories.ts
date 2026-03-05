"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@wisdom-journal/shared";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      const supabase = createClient();
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");

      if (data) {
        setCategories(data as Category[]);
      }
      setLoading(false);
    }

    fetchCategories();
  }, []);

  return { categories, loading };
}
