"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useRefreshOnMount() {
  const router = useRouter();

  useEffect(() => {
    router.refresh();
  }, [router]);
}
