"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { ButtonLink } from "@/components/design/Button";
import { Wordmark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Home", href: "/", match: "/" },
  { label: "How it works", href: "/how-it-works", match: "/how-it-works" },
  { label: "Features", href: "/features", match: "/features" },
  { label: "About creator", href: "/about", match: "/about" },
  { label: "Safety", href: "/legal/security", match: "/legal/security" },
];

export function AppHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <nav
        aria-label="Primary"
        className={cn(
          "glass-nav mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full px-3 py-2.5 transition-shadow sm:px-5",
          scrolled && "shadow-[0_12px_34px_rgba(22,34,59,0.12)]",
        )}
      >
        <Link href="/" className="rounded-full" aria-label="Groundline home">
          <Wordmark />
        </Link>

        <div className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.match ? "page" : undefined}
              className={cn(
                "rounded-full px-2 py-2 text-xs font-medium transition hover:bg-white/70 hover:text-ink xl:px-2.5 xl:text-sm",
                pathname === item.match ? "bg-white/75 text-ink" : "text-ink-soft",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:block">
          <ButtonLink href="/studio" size="sm">
            Open Studio
          </ButtonLink>
        </div>

        <button
          type="button"
          className="rounded-full p-2 text-ink-soft hover:bg-white/70 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="glass-nav mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-3xl p-3 lg:hidden"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === item.match ? "page" : undefined}
              className={cn(
                "rounded-2xl px-4 py-3 text-sm font-medium transition hover:bg-white/70 hover:text-ink",
                pathname === item.match ? "bg-white/75 text-ink" : "text-ink-soft",
              )}
            >
              {item.label}
            </Link>
          ))}
          <ButtonLink href="/studio" size="md" className="mt-1 w-full" onClick={() => setOpen(false)}>
            Open Studio
          </ButtonLink>
        </div>
      )}
    </header>
  );
}
