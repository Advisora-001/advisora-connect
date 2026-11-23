"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LawyersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to professionals page with legal category
    const params = new URLSearchParams(searchParams.toString());
    params.set('category', 'legal');
    router.replace(`/professionals?${params.toString()}`);
  }, [router, searchParams]);

  return null;
}