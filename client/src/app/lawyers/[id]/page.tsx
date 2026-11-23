"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LawyerDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/professionals/${id}`);
  }, [router, id]);

  return null;
}