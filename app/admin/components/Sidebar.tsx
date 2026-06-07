"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, LogOut } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Track open state per menu
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [pendingCount, setPendingCount] = useState(0);

  /* ---------------- Fetch Pending Ads Count ---------------- */
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await fetch("/api/ads");
        const data = await res.json();
        const count = data.filter(
          (ad: any) => ad.status?.toLowerCase() === "pending",
        ).length;
        setPendingCount(count);
      } catch (err) {
        console.error("Failed to fetch pending ads count", err);
      }
    };

    fetchPendingCount();
    // const interval = setInterval(fetchPendingCount, 60000);
    // return () => clearInterval(interval);
  }, []);

  /* ---------------- Auto-open submenu by route ---------------- */
  useEffect(() => {
    if (pathname.startsWith("/admin/advertisements")) {
      setOpenMenus((p) => ({ ...p, Advertisements: true }));
    }

    if (pathname.startsWith("/admin/settings")) {
      setOpenMenus((p) => ({ ...p, "Other Settings": true }));
    }
  }, [pathname]);

  /* ---------------- Toggle Menu ---------------- */
  function toggleMenu(name: string) {
    setOpenMenus((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin-login");
  }

  const menuItems = [
    { name: "Dashboard", href: "/admin" },
    {
      name: "Advertisements",
      href: "/admin/advertisements/all",
      // subItems: [
      //   { name: "Pending", href: "/admin/advertisements/pending" },
      //   { name: "All", href: "/admin/advertisements/all" },
      // ],
    },
    { name: "Newspapers", href: "/admin/newspapers" },
    { name: "Promotions/Offers", href: "/admin/promo" },
    { name: "Users", href: "/admin/users" },
    {
      name: "Other Settings",
      href: "/admin/settings",
      subItems: [
        { name: "Ad Types Manager", href: "/admin/settings/AdTypes" },
        { name: "Miscellaneous", href: "/admin/settings/Misc" },
      ],
    },
  ];

  return (
    <aside className="w-64 h-screen p-6 flex flex-col bg-[var(--color-primary)] text-white">
      {/* Logo */}
      <div className="flex justify-center">
        <Image
          src="/sample-logo-1.png"
          alt="Paththare Ads Logo"
          width={150}
          height={60}
        />
      </div>

      <h2 className="text-2xl font-extrabold text-center mb-6">Admin</h2>

      {/* Menu */}
      <ul className="flex flex-col gap-3">
        {menuItems.map((item) => (
          <li key={item.name}>
            {item.subItems ? (
              <>
                {/* Parent Menu */}
                <button
                  onClick={() => toggleMenu(item.name)}
                  className="w-full flex justify-between items-center px-4 py-2 rounded-lg font-medium transition hover:bg-[var(--color-primary-dark)]"
                >
                  {item.name}
                  {openMenus[item.name] ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>

                {/* Submenu */}
                <ul
                  className={`pl-6 mt-1 flex flex-col gap-1 overflow-hidden transition-all duration-300 ease-in-out ${
                    openMenus[item.name] ? "max-h-40" : "max-h-0"
                  }`}
                >
                  {item.subItems.map((sub) => (
                    <li key={sub.name}>
                      <Link
                        href={sub.href}
                        className={`flex justify-between items-center px-3 py-2 rounded-md text-sm transition-colors ${
                          pathname === sub.href
                            ? "text-white"
                            : "text-gray-300 hover:bg-[var(--color-primary-dark)]"
                        }`}
                      >
                        {sub.name}

                        {sub.name === "Pending" && pendingCount > 0 && (
                          <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold bg-red-600 rounded-full">
                            {pendingCount}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <Link
                href={item.href}
                className={`block px-4 py-2 rounded-lg font-medium transition hover:bg-[var(--color-primary-dark)] ${
                  pathname === item.href ? "bg-[var(--color-primary-dark)]" : ""
                }`}
              >
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ul>

      {/* Bottom */}
      <div className="mt-auto space-y-4">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full rounded-lg bg-[var(--color-primary-dark)] px-4 py-2 font-semibold hover:bg-red-700"
        >
          <LogOut size={18} />
          Logout
        </button>

        <div className="text-sm text-center border-t border-gray-700 pt-4">
          &copy; {new Date().getFullYear()} Paththare Ads
          <br />
          Powered by Hastec
        </div>
      </div>
    </aside>
  );
}
