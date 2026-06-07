"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface RoleCheckProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export default function RoleCheck({ allowedRoles, children }: RoleCheckProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Read cookie from browser (client-only)
    const rolesCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("admin_roles="));
    console.log("here document cookie 1: ", document.cookie);
    console.log("here roles cookie: ", rolesCookie);

    if (!rolesCookie) {
      setHasAccess(false);
      toast.error("You do not have access to this page!");
      return;
    }

    try {
      const roles = JSON.parse(decodeURIComponent(rolesCookie.split("=")[1]));
      const access = roles.some((role: string) => allowedRoles.includes(role));
      setHasAccess(access);

      if (!access) toast.error("You do not have access to this page!");
    } catch {
      setHasAccess(false);
      toast.error("You do not have access to this page!");
    }
  }, [allowedRoles]);

  if (hasAccess === null) return null; // still loading
  if (!hasAccess)
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-red-600 font-semibold">
        You do not have access to this page.
        <button
          onClick={() => router.push("/admin")}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
        >
          Go Back
        </button>
      </div>
    );

  return <>{children}</>;
}
