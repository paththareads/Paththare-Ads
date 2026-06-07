"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Menu, X } from "lucide-react";
import clsx from "clsx";
import { usePathname, useRouter } from "next/navigation";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "How To", href: "/how-to" },
    { name: "Online Ads", href: "/online-ads" },
    { name: "About Us", href: "/about-us" },
    { name: "Reviews", href: "/#" },
    { name: "Contact Us", href: "/contact-us" },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePostAdClick = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    href: string,
  ) => {
    if (pathname === "/post-ad") {
      e.preventDefault();
      setConfirmModalOpen(true);
    } else {
      router.push(href);
    }
  };

  const confirmLeave = () => {
    setConfirmModalOpen(false);
    window.location.href = "/post-ad";
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <header
        className={clsx(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          "bg-gradient-to-b from-[#042a36] via-[#06394a] via-[#0a4b5f] to-[#0e5f73]",
          "text-white shadow-md",
          isScrolled
            ? "h-24 bg-gradient-to-b from-[#042a36]/95 via-[#06394a]/95 via-[#0a4b5f]/95 to-[#0e5f73]/95 backdrop-blur-md"
            : "h-36 md:h-44 bg-gradient-to-b from-[#042a36] via-[#06394a] via-[#0a4b5f] to-[#0e5f73]",
        )}
      >
        <div className="mx-auto flex h-full max-w-7/10 flex-col px-4 md:px-4">
          {/* {!isScrolled && (
            <div className="hidden items-center justify-end py-1 text-xs sm:flex">
              <a
                href="mailto:themedialink@gmail.com"
                className="flex items-center gap-2 opacity-90 hover:opacity-100"
              >
                <Mail size={14} />
                themedialink@gmail.com
              </a>
            </div>
          )} */}

          <div className="flex flex-1 items-center justify-between gap-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/sample-logo-1.png"
                alt="Paththare Ads Logo"
                width={isScrolled ? 140 : 300}
                height={100}
                className="object-contain transition-all"
                priority
              />
            </Link>

            {!isScrolled && (
              <div className="hidden flex-1 justify-center md:flex">
                <input
                  type="text"
                  placeholder="Search ads..."
                  className="w-full max-w-md rounded-full border border-white/40 bg-transparent px-4 py-2 text-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
              </div>
            )}

            {!isScrolled && (
              <div className="hidden items-center gap-3 md:flex">
                <Link
                  href="/post-ad"
                  onClick={(e) => handlePostAdClick(e, "/post-ad")}
                  // className="rounded-xl bg-primary-dark px-6 py-2 text-sm font-medium text-white transition hover:brightness-110"
                  className="specialBtn rounded-xl px-6 py-2"
                >
                  Post Your Ad
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center md:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <nav className="hidden justify-center md:flex">
            <ul className="flex gap-8 py-3 text-base">
              {navLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-lg font-semibold transition hover:text-[var(--color-text-highlight)]"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      {/* ================= MOBILE MENU ================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-20 z-40 flex flex-col items-center gap-4 bg-[#383A3D] py-6 shadow-md md:hidden">
          {navLinks.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg text-white opacity-90 transition hover:opacity-100"
            >
              {item.name}
            </Link>
          ))}

          <div className="mt-4 flex flex-col gap-3">
            <Link
              href="/post-ad"
              onClick={(e) => handlePostAdClick(e, "/post-ad")}
              className="rounded-full bg-orange-accent px-6 py-4 text-center text-sm font-medium text-primary-dark"
            >
              Post Your Ad
            </Link>
            {/* <button className="rounded-full border border-white/40 px-6 py-2 text-sm text-white">
              Login / Register
            </button> */}
          </div>
        </div>
      )}

      {/* ================= CONFIRM MODAL ================= */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-[var(--color-primary-dark)] p-6 w-80 text-white shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Already Here!</h2>
            <p className="mb-6 text-sm">
              You are already on the Post Ad page. Do you want to start over?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="rounded-full bg-[var(--color-button)] px-4 py-1.5 text-sm font-medium transition hover:bg-[var(--color-primary)] text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmLeave}
                className="rounded-full bg-[var(--color-orange-accent)] px-4 py-1.5 text-sm font-medium text-[var(--color-primary-dark)] transition hover:brightness-110"
              >
                Yes, Start Over!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
