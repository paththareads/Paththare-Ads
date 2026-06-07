// app/admin/components/NoAccessClient.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function NoAccessClient() {
  const router = useRouter();

  useEffect(() => {
    toast.error("You do not have access to this page");
  }, []);

  return (
    <div className="flex justify-center items-center min-h-[300px]">
      <button
        onClick={() => router.push("/admin")}
        className="rounded bg-blue-600 px-4 py-2 text-white"
      >
        Go back
      </button>
    </div>
  );
}
